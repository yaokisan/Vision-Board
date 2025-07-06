/**
 * 組織図サービス
 * TDD実装：組織図での役割割り当てロジック
 */

import {
  Member,
  MemberRole,
  RoleType,
  BusinessMemberList
} from '@/types'
import { MemberDAO } from './MemberDAO'
import { OrganizationDAO } from './OrganizationDAO'

export class OrganizationService {
  /**
   * メンバーに複数の役割を割り当て
   */
  static async assignMultipleRoles(memberId: string, roles: Array<{
    roleType: RoleType
    referenceId: string
  }>): Promise<{
    success: boolean
    assignedRoles: string[]
    errors?: string[]
  }> {
    try {
      const assignedRoles: string[] = []
      const errors: string[] = []

      for (const role of roles) {
        try {
          const memberRole: MemberRole = {
            id: generateId(),
            member_id: memberId,
            role_type: role.roleType,
            reference_id: role.referenceId,
            created_at: new Date().toISOString()
          }

          // データベースに保存
          await MemberDAO.addMemberRole(memberRole)
          
          assignedRoles.push(`${role.roleType}:${role.referenceId}`)
        } catch (error) {
          errors.push(`${role.roleType}の割り当てに失敗: ${error}`)
        }
      }

      return {
        success: errors.length === 0,
        assignedRoles,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      console.error('複数役割割り当てエラー:', error)
      return {
        success: false,
        assignedRoles: [],
        errors: ['役割割り当て処理に失敗しました']
      }
    }
  }

  /**
   * 特定事業の責任者を設定
   */
  static async assignBusinessManager(businessId: string, memberId: string): Promise<{
    success: boolean
    previousManager?: string
  }> {
    try {
      // 1. 現在の責任者を取得
      const currentManager = await this.getCurrentBusinessManager(businessId)
      
      // 2. 既存の責任者がいる場合は役割を除外
      if (currentManager && currentManager.member_id) {
        await this.removeMemberRole(currentManager.member_id, 'business_manager', businessId)
      }

      // 3. 新しい責任者を設定
      const newRole: MemberRole = {
        id: generateId(),
        member_id: memberId,
        role_type: 'business_manager',
        reference_id: businessId,
        created_at: new Date().toISOString()
      }

      // データベースに保存
      await MemberDAO.addMemberRole(newRole)

      // 4. 事業テーブルの責任者も更新
      await this.updateBusinessResponsiblePerson(businessId, memberId)

      return {
        success: true,
        previousManager: currentManager?.member_id ?? undefined
      }
    } catch (error) {
      console.error('事業責任者設定エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 特定業務の責任者を設定
   */
  static async assignTaskManager(taskId: string, memberId: string): Promise<{
    success: boolean
    previousManager?: string
  }> {
    try {
      // 1. 現在の責任者を取得
      const currentManager = await this.getCurrentTaskManager(taskId)
      
      // 2. 既存の責任者がいる場合は役割を除外
      if (currentManager && currentManager.member_id) {
        await this.removeMemberRole(currentManager.member_id, 'task_manager', taskId)
      }

      // 3. 新しい責任者を設定
      const newRole: MemberRole = {
        id: generateId(),
        member_id: memberId,
        role_type: 'task_manager',
        reference_id: taskId,
        created_at: new Date().toISOString()
      }

      // データベースに保存
      await MemberDAO.addMemberRole(newRole)

      // 4. 業務テーブルの責任者も更新
      await this.updateTaskResponsiblePerson(taskId, memberId)

      return {
        success: true,
        previousManager: currentManager?.member_id ?? undefined
      }
    } catch (error) {
      console.error('業務責任者設定エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 経営層の役職を設定
   */
  static async assignPosition(positionId: string, memberId: string): Promise<{
    success: boolean
    previousMember?: string
  }> {
    try {
      // 1. 現在の役職者を取得
      const currentMember = await this.getCurrentPositionMember(positionId)
      
      // 2. 既存の役職者がいる場合は役割を除外
      if (currentMember && currentMember.member_id) {
        await this.removeMemberRole(currentMember.member_id, 'position', positionId)
      }

      // 3. 新しい役職者を設定
      const newRole: MemberRole = {
        id: generateId(),
        member_id: memberId,
        role_type: 'position',
        reference_id: positionId,
        created_at: new Date().toISOString()
      }

      // データベースに保存
      await MemberDAO.addMemberRole(newRole)

      // 4. 役職テーブルのメンバーも更新
      await this.updatePositionMember(positionId, memberId)

      return {
        success: true,
        previousMember: currentMember?.member_id ?? undefined
      }
    } catch (error) {
      console.error('役職設定エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * メンバーの全役割を取得
   */
  static async getMemberRoles(memberId: string): Promise<Array<{
    roleType: RoleType
    referenceId: string
    referenceName: string
  }>> {
    try {
      const roles = await this.getMemberRolesByMemberId(memberId)
      
      const rolesWithNames = await Promise.all(
        roles.map(async role => {
          const referenceName = await this.getRoleReferenceName(role.role_type, role.reference_id)
          return {
            roleType: role.role_type,
            referenceId: role.reference_id,
            referenceName
          }
        })
      )

      return rolesWithNames
    } catch (error) {
      console.error('メンバー役割取得エラー:', error)
      return []
    }
  }

  /**
   * 組織図で使用されているメンバーを確認
   */
  static async getUsedMembers(): Promise<Array<{
    memberId: string
    memberName: string
    roles: Array<{
      roleType: RoleType
      referenceName: string
    }>
  }>> {
    try {
      // 全ての役割を取得
      const allRoles = await this.getAllMemberRoles()
      
      // メンバーIDでグループ化
      const memberRoleMap = new Map<string, MemberRole[]>()
      allRoles.forEach(role => {
        if (!memberRoleMap.has(role.member_id)) {
          memberRoleMap.set(role.member_id, [])
        }
        memberRoleMap.get(role.member_id)!.push(role)
      })

      // メンバー情報と役割を結合
      const usedMembers = await Promise.all(
        Array.from(memberRoleMap.entries()).map(async ([memberId, roles]) => {
          const member = await this.getMemberById(memberId)
          const rolesWithNames = await Promise.all(
            roles.map(async role => ({
              roleType: role.role_type,
              referenceName: await this.getRoleReferenceName(role.role_type, role.reference_id)
            }))
          )

          return {
            memberId,
            memberName: member?.name || '不明なメンバー',
            roles: rolesWithNames
          }
        })
      )

      return usedMembers
    } catch (error) {
      console.error('使用中メンバー取得エラー:', error)
      return []
    }
  }

  /**
   * メンバー削除時の組織図への影響を確認
   */
  static async getOrganizationImpact(memberId: string): Promise<{
    affectedPositions: string[]
    affectedBusinesses: string[]
    affectedTasks: string[]
  }> {
    try {
      const roles = await this.getMemberRolesByMemberId(memberId)
      
      const impact = {
        affectedPositions: [],
        affectedBusinesses: [],
        affectedTasks: []
      } as any

      roles.forEach(role => {
        switch (role.role_type) {
          case 'position':
            impact.affectedPositions.push(role.reference_id)
            break
          case 'business_manager':
            impact.affectedBusinesses.push(role.reference_id)
            break
          case 'task_manager':
            impact.affectedTasks.push(role.reference_id)
            break
        }
      })

      return impact
    } catch (error) {
      console.error('組織図影響確認エラー:', error)
      return {
        affectedPositions: [],
        affectedBusinesses: [],
        affectedTasks: []
      }
    }
  }

  // ============================================
  // プライベートヘルパーメソッド
  // ============================================

  private static async getCurrentBusinessManager(businessId: string): Promise<{
    member_id: string | null,
    person_name: string | null
  } | null> {
    return await OrganizationDAO.getCurrentBusinessManager(businessId)
  }

  private static async getCurrentTaskManager(taskId: string): Promise<{
    member_id: string | null,
    person_name: string | null
  } | null> {
    return await OrganizationDAO.getCurrentTaskManager(taskId)
  }

  private static async getCurrentPositionMember(positionId: string): Promise<{
    member_id: string | null,
    person_name: string | null
  } | null> {
    return await OrganizationDAO.getCurrentPositionMember(positionId)
  }

  private static async removeMemberRole(memberId: string, roleType: RoleType, referenceId: string): Promise<void> {
    await MemberDAO.removeMemberRole(memberId, roleType, referenceId)
  }

  private static async updateBusinessResponsiblePerson(businessId: string, memberId: string): Promise<void> {
    await OrganizationDAO.updateBusinessResponsiblePerson(businessId, memberId)
  }

  private static async updateTaskResponsiblePerson(taskId: string, memberId: string): Promise<void> {
    await OrganizationDAO.updateTaskResponsiblePerson(taskId, memberId)
  }

  private static async updatePositionMember(positionId: string, memberId: string): Promise<void> {
    await OrganizationDAO.updatePositionMember(positionId, memberId)
  }

  private static async getMemberRolesByMemberId(memberId: string): Promise<MemberRole[]> {
    return await MemberDAO.getMemberRoles(memberId)
  }

  private static async getRoleReferenceName(roleType: RoleType, referenceId: string): Promise<string> {
    return await OrganizationDAO.getRoleReferenceName(roleType, referenceId)
  }

  private static async getAllMemberRoles(): Promise<MemberRole[]> {
    // NOTE: 会社IDが必要だが、現在のメソッドシグネチャでは取得できない
    // 実際の実装では会社IDをパラメータとして受け取る必要がある
    throw new Error('getAllMemberRoles requires company_id parameter')
  }

  private static async getMemberById(memberId: string): Promise<Member | null> {
    return await MemberDAO.getMemberById(memberId)
  }
}

// ヘルパー関数
function generateId(): string {
  return `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}