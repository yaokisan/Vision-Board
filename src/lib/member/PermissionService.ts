/**
 * 権限管理サービス
 * TDD実装：権限チェックのビジネスロジック
 */

import {
  Member,
  MemberPermission,
  PermissionCheck
} from '@/types'
import { MemberDAO } from './MemberDAO'
import { OrganizationDAO } from './OrganizationDAO'

export class PermissionService {
  /**
   * メンバー管理権限をチェック
   */
  static canManageMembers(member: Member): boolean {
    return member.permission === 'admin'
  }

  /**
   * 全タブ閲覧権限をチェック
   */
  static canViewAllTabs(member: Member): boolean {
    return member.permission === 'admin' || member.permission === 'viewer'
  }

  /**
   * メンバーページ閲覧権限をチェック
   */
  static canViewMemberPage(member: Member): boolean {
    return member.permission === 'admin' || member.permission === 'viewer'
  }

  /**
   * 組織図編集権限をチェック
   */
  static canEditOrganization(member: Member): boolean {
    return member.permission === 'admin'
  }

  /**
   * 特定事業の閲覧権限をチェック
   */
  static async canViewBusiness(member: Member, businessId: string): Promise<boolean> {
    // 管理者と閲覧者は全事業を閲覧可能
    if (member.permission === 'admin' || member.permission === 'viewer') {
      return true
    }

    // 制限ユーザーは所属事業のみ閲覧可能
    if (member.permission === 'restricted') {
      const memberBusinesses = await this.getMemberBusinesses(member.id)
      return memberBusinesses.includes(businessId)
    }

    return false
  }

  /**
   * 包括的な権限チェック
   */
  static async getPermissionCheck(member: Member): Promise<PermissionCheck> {
    const memberBusinesses = await this.getMemberBusinesses(member.id)

    return {
      can_manage_members: this.canManageMembers(member),
      can_view_all_tabs: this.canViewAllTabs(member),
      can_view_member_page: this.canViewMemberPage(member),
      can_edit_organization: this.canEditOrganization(member),
      accessible_business_ids: this.canViewAllTabs(member) 
        ? await this.getAllBusinessIds(member.company_id)
        : memberBusinesses
    }
  }

  /**
   * ユーザーの所属事業を取得
   */
  private static async getMemberBusinesses(memberId: string): Promise<string[]> {
    const memberBusinesses = await MemberDAO.getMemberBusinesses(memberId)
    return memberBusinesses.map(mb => mb.business_id)
  }

  /**
   * 会社の全事業IDを取得
   */
  private static async getAllBusinessIds(companyId: string): Promise<string[]> {
    return await MemberDAO.getAllBusinessIds(companyId)
  }

  /**
   * セッション管理：権限変更時の処理
   */
  static async handlePermissionChange(memberId: string, newPermission: MemberPermission): Promise<{
    requiresLogout: boolean
    message: string
  }> {
    // 制限ユーザーへの降格時は要注意
    if (newPermission === 'restricted') {
      return {
        requiresLogout: false, // リロードで対応
        message: '権限が制限ユーザーに変更されました。ページをリロードしてください。'
      }
    }

    // 管理者への昇格時
    if (newPermission === 'admin') {
      return {
        requiresLogout: false,
        message: '管理者権限が付与されました。ページをリロードして新機能をご利用ください。'
      }
    }

    return {
      requiresLogout: false,
      message: '権限が更新されました。ページをリロードしてください。'
    }
  }

  /**
   * タブアクセス制御
   */
  static async getAccessibleTabs(member: Member): Promise<{
    company: boolean
    businesses: string[] // アクセス可能な事業ID
  }> {
    if (this.canViewAllTabs(member)) {
      // 管理者・閲覧者は全タブアクセス可能
      const allBusinessIds = await this.getAllBusinessIds(member.company_id)
      return {
        company: true,
        businesses: allBusinessIds
      }
    }

    // 制限ユーザーは所属事業のみ
    const memberBusinesses = await this.getMemberBusinesses(member.id)
    return {
      company: false,
      businesses: memberBusinesses
    }
  }

  /**
   * メンバー操作権限チェック
   */
  static canModifyMember(currentUser: Member, targetMember: Member): {
    canEdit: boolean
    canDelete: boolean
    reason?: string
  } {
    // 管理者のみメンバー操作可能
    if (currentUser.permission !== 'admin') {
      return {
        canEdit: false,
        canDelete: false,
        reason: '管理者権限が必要です'
      }
    }

    // 自分自身の権限変更には注意
    if (currentUser.id === targetMember.id && targetMember.permission === 'admin') {
      return {
        canEdit: true,
        canDelete: false,
        reason: '最後の管理者を削除することはできません'
      }
    }

    return {
      canEdit: true,
      canDelete: true
    }
  }

  /**
   * 組織図編集可能な箇所の判定
   */
  static async getEditableOrganizationAreas(member: Member): Promise<{
    positions: boolean // 経営層
    allBusinesses: boolean // 全事業
    businesses: string[] // 編集可能な事業ID
    allTasks: boolean // 全業務
    tasks: string[] // 編集可能な業務ID
  }> {
    if (member.permission === 'admin') {
      // 管理者は全て編集可能
      return {
        positions: true,
        allBusinesses: true,
        businesses: await this.getAllBusinessIds(member.company_id),
        allTasks: true,
        tasks: await this.getAllTaskIds(member.company_id)
      }
    }

    // 管理者以外は編集不可
    return {
      positions: false,
      allBusinesses: false,
      businesses: [],
      allTasks: false,
      tasks: []
    }
  }

  private static async getAllTaskIds(companyId: string): Promise<string[]> {
    const tasks = await OrganizationDAO.getTasksByCompany(companyId)
    return tasks.map(task => task.id)
  }
}