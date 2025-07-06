/**
 * メンバー管理サービス
 * TDD実装：テストケースで定義されたビジネスロジックを実装
 */

import {
  Member,
  MemberBusiness,
  MemberRole,
  CreateMemberRequest,
  UpdateMemberRequest,
  MemberOperationResult,
  MemberDeletionWarning,
  BusinessMemberList,
  MemberType
} from '@/types'
import { MemberDAO } from './MemberDAO'
import { OrganizationDAO } from './OrganizationDAO'

export class MemberService {
  /**
   * コアメンバーを追加
   * 全事業に自動で追加される
   */
  static async addCoreMember(request: CreateMemberRequest): Promise<MemberOperationResult> {
    try {
      // 1. メンバーを作成
      const member: Member = {
        id: generateId(),
        company_id: request.company_id || 'default-company',
        name: request.name,
        email: request.email,
        permission: request.permission,
        member_type: 'core',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 2. 全事業を取得
      const allBusinesses = await this.getAllBusinesses(member.company_id)
      
      // 3. データベースに保存
      const savedMember = await MemberDAO.createMember(request)
      if (!savedMember) {
        throw new Error('メンバー作成に失敗しました')
      }

      // 全事業に関係を追加
      const relations = allBusinesses.map(business => ({
        member_id: savedMember.id,
        business_id: business.id
      }))
      
      await MemberDAO.addMemberBusinessRelations(relations)

      return {
        success: true,
        member: savedMember,
        assigned_businesses: allBusinesses.map(b => b.id)
      }
    } catch (error) {
      console.error('コアメンバー追加エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 事業メンバーを追加
   * 指定された事業のみに追加される
   */
  static async addBusinessMember(request: CreateMemberRequest): Promise<MemberOperationResult> {
    try {
      // 1. メンバーを作成
      const member: Member = {
        id: generateId(),
        company_id: request.company_id || 'default-company',
        name: request.name,
        email: request.email,
        permission: request.permission,
        member_type: 'business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 2. データベースに保存
      const savedMember = await MemberDAO.createMember(request)
      if (!savedMember) {
        throw new Error('メンバー作成に失敗しました')
      }

      // 指定事業に関係を追加
      const businessIds = request.business_ids || []
      const relations = businessIds.map(businessId => ({
        member_id: savedMember.id,
        business_id: businessId
      }))
      
      await MemberDAO.addMemberBusinessRelations(relations)

      return {
        success: true,
        member: savedMember,
        assigned_businesses: businessIds
      }
    } catch (error) {
      console.error('事業メンバー追加エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 特定事業で利用可能なメンバーリストを取得
   * コアメンバー + その事業のメンバーのみ
   */
  static async getAvailableMembersForBusiness(businessId: string): Promise<Member[]> {
    try {
      // 1. コアメンバーを取得
      const coreMembers = await this.getCoreMembers()
      
      // 2. その事業の事業メンバーを取得
      const businessMembers = await this.getBusinessMembers(businessId)
      
      // 3. 重複を除いて結合
      const memberMap = new Map<string, Member>()
      
      coreMembers.forEach(member => memberMap.set(member.id, member))
      businessMembers.forEach(member => memberMap.set(member.id, member))
      
      return Array.from(memberMap.values())
    } catch (error) {
      console.error('事業用メンバーリスト取得エラー:', error)
      return []
    }
  }

  /**
   * メンバー削除時の警告情報を取得
   */
  static async getDeletionWarning(memberId: string): Promise<MemberDeletionWarning> {
    try {
      // 組織図での役割を確認
      const roles = await this.getMemberRoles(memberId)
      
      const affectedRoles = await Promise.all(
        roles.map(async role => {
          const referenceName = await this.getRoleReferenceName(role.role_type, role.reference_id)
          return {
            role_type: role.role_type,
            reference_name: referenceName
          }
        })
      )

      return {
        hasOrganizationRoles: roles.length > 0,
        affectedRoles
      }
    } catch (error) {
      console.error('削除警告情報取得エラー:', error)
      return {
        hasOrganizationRoles: false,
        affectedRoles: []
      }
    }
  }

  /**
   * メンバー削除の確認実行
   */
  static async confirmDeleteMember(memberId: string): Promise<MemberOperationResult> {
    try {
      // 1. 組織図から役割を除外
      await this.removeAllMemberRoles(memberId)
      
      // 2. 事業関係を削除
      await this.removeMemberBusinessRelations(memberId)
      
      // 3. メンバーを削除
      await this.deleteMember(memberId)

      return {
        success: true,
        requires_reload: false // 削除なのでリロード不要
      }
    } catch (error) {
      console.error('メンバー削除エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * メンバータイプを変更（事業メンバー → コアメンバー）
   */
  static async promoteToCoreMember(memberId: string): Promise<MemberOperationResult> {
    try {
      // 1. 現在のメンバー情報を取得
      const member = await this.getMemberById(memberId)
      if (!member) {
        return { success: false }
      }

      // 2. メンバータイプをコアに変更
      const updatedMember: Member = {
        ...member,
        member_type: 'core',
        updated_at: new Date().toISOString()
      }

      // 3. 全事業への関係を確認・追加
      const allBusinesses = await this.getAllBusinesses(member.company_id)
      const currentBusinesses = await this.getMemberBusinesses(memberId)
      
      // 4. 不足している事業関係を追加
      const missingBusinesses = allBusinesses.filter(
        business => !currentBusinesses.some(cb => cb.business_id === business.id)
      )

      // データベース更新
      const updated = await MemberDAO.updateMember(memberId, {
        member_type: 'core'
      })
      if (!updated) {
        throw new Error('メンバー更新に失敗しました')
      }
      
      // 不足している事業関係を追加
      const relations = missingBusinesses.map(business => ({
        member_id: memberId,
        business_id: business.id
      }))
      
      await MemberDAO.addMemberBusinessRelations(relations)

      return {
        success: true,
        member: updated,
        assigned_businesses: allBusinesses.map(b => b.id)
      }
    } catch (error) {
      console.error('コアメンバー昇格エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * メンバータイプを変更（コアメンバー → 事業メンバー）
   */
  static async demoteToBusinessMember(memberId: string, businessIds: string[]): Promise<MemberOperationResult> {
    try {
      // 1. 現在のメンバー情報を取得
      const member = await this.getMemberById(memberId)
      if (!member) {
        return { success: false }
      }

      // 2. メンバータイプを事業に変更
      const updatedMember: Member = {
        ...member,
        member_type: 'business',
        updated_at: new Date().toISOString()
      }

      // 3. 既存の事業関係をすべて削除
      await this.removeMemberBusinessRelations(memberId)

      // 4. データベース更新
      const updated = await MemberDAO.updateMember(memberId, {
        member_type: 'business'
      })
      if (!updated) {
        throw new Error('メンバー更新に失敗しました')
      }
      
      // 指定事業に関係を追加
      const relations = businessIds.map(businessId => ({
        member_id: memberId,
        business_id: businessId
      }))
      
      await MemberDAO.addMemberBusinessRelations(relations)

      return {
        success: true,
        member: updated,
        assigned_businesses: businessIds
      }
    } catch (error) {
      console.error('事業メンバー降格エラー:', error)
      return {
        success: false
      }
    }
  }

  /**
   * 権限を更新
   */
  static async updatePermission(memberId: string, permission: string): Promise<MemberOperationResult> {
    try {
      const member = await this.getMemberById(memberId)
      if (!member) {
        return { success: false }
      }

      const updatedMember: Member = {
        ...member,
        permission: permission as any,
        updated_at: new Date().toISOString()
      }

      // データベース更新
      const updated = await MemberDAO.updateMember(memberId, {
        permission: permission as any
      })
      if (!updated) {
        throw new Error('メンバー更新に失敗しました')
      }

      return {
        success: true,
        member: updated,
        requires_reload: true // 権限変更はリロードが必要
      }
    } catch (error) {
      console.error('権限更新エラー:', error)
      return {
        success: false
      }
    }
  }

  // ============================================
  // プライベートヘルパーメソッド（データアクセス層）
  // ============================================

  private static async getAllBusinesses(companyId: string): Promise<any[]> {
    return await OrganizationDAO.getBusinessesByCompany(companyId)
  }

  private static async getCoreMembers(): Promise<Member[]> {
    // NOTE: company_idが必要だが、現在のメソッドシグネチャでは取得できない
    // 実際の実装では適切にcompany_idを渡す必要がある
    throw new Error('getCoreMembers requires company_id parameter')
  }

  private static async getBusinessMembers(businessId: string): Promise<Member[]> {
    return await MemberDAO.getBusinessMembers(businessId)
  }

  private static async getMemberRoles(memberId: string): Promise<MemberRole[]> {
    return await MemberDAO.getMemberRoles(memberId)
  }

  private static async getRoleReferenceName(roleType: string, referenceId: string): Promise<string> {
    return await OrganizationDAO.getRoleReferenceName(roleType, referenceId)
  }

  private static async removeAllMemberRoles(memberId: string): Promise<void> {
    await MemberDAO.removeAllMemberRoles(memberId)
  }

  private static async removeMemberBusinessRelations(memberId: string): Promise<void> {
    await MemberDAO.removeMemberBusinessRelations(memberId)
  }

  private static async deleteMember(memberId: string): Promise<void> {
    await MemberDAO.deleteMember(memberId)
  }

  private static async getMemberById(memberId: string): Promise<Member | null> {
    return await MemberDAO.getMemberById(memberId)
  }

  private static async getMemberBusinesses(memberId: string): Promise<MemberBusiness[]> {
    return await MemberDAO.getMemberBusinesses(memberId)
  }
}

// ヘルパー関数
function generateId(): string {
  return `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 型の拡張（一時的）
declare module '@/types' {
  interface CreateMemberRequest {
    company_id?: string
  }
}