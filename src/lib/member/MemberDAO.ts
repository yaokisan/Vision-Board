/**
 * メンバー管理データアクセスオブジェクト（DAO）
 * Supabaseとの実際のデータベース操作を担当
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import {
  Member,
  MemberBusiness,
  MemberRole,
  CreateMemberRequest,
  UpdateMemberRequest,
  BusinessMemberList
} from '@/types'

type MemberRow = Database['public']['Tables']['members']['Row']
type MemberInsert = Database['public']['Tables']['members']['Insert']
type MemberUpdate = Database['public']['Tables']['members']['Update']

type MemberBusinessRow = Database['public']['Tables']['member_businesses']['Row']
type MemberBusinessInsert = Database['public']['Tables']['member_businesses']['Insert']

type MemberRoleRow = Database['public']['Tables']['member_roles']['Row']
type MemberRoleInsert = Database['public']['Tables']['member_roles']['Insert']

export class MemberDAO {
  // ============================================
  // メンバー基本操作
  // ============================================

  /**
   * メンバーをIDで取得
   */
  static async getMemberById(id: string): Promise<Member | null> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('メンバー取得エラー:', error)
        return null
      }

      return this.convertRowToMember(data)
    } catch (error) {
      console.error('メンバー取得例外:', error)
      return null
    }
  }

  /**
   * 会社のメンバー一覧を取得
   */
  static async getMembersByCompany(companyId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('会社メンバー取得エラー:', error)
        return []
      }

      return data.map(this.convertRowToMember)
    } catch (error) {
      console.error('会社メンバー取得例外:', error)
      return []
    }
  }

  /**
   * コアメンバーを取得
   */
  static async getCoreMembers(companyId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('company_id', companyId)
        .eq('member_type', 'core')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('コアメンバー取得エラー:', error)
        return []
      }

      return data.map(this.convertRowToMember)
    } catch (error) {
      console.error('コアメンバー取得例外:', error)
      return []
    }
  }

  /**
   * 特定事業のメンバーを取得
   */
  static async getBusinessMembers(businessId: string): Promise<Member[]> {
    try {
      const { data, error } = await supabase
        .from('member_businesses')
        .select(`
          members (*)
        `)
        .eq('business_id', businessId)

      if (error) {
        console.error('事業メンバー取得エラー:', error)
        return []
      }

      return data
        .map(item => item.members)
        .filter(member => member !== null)
        .map((member: any) => this.convertRowToMember(member))
    } catch (error) {
      console.error('事業メンバー取得例外:', error)
      return []
    }
  }

  /**
   * 事業用メンバーリストを取得（組織図編集用）
   */
  static async getBusinessMemberList(businessId: string): Promise<BusinessMemberList> {
    try {
      // 1. 事業情報を取得
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('company_id')
        .eq('id', businessId)
        .single()

      if (businessError) {
        throw businessError
      }

      // 2. コアメンバーを取得
      const coreMembers = await this.getCoreMembers(businessData.company_id)

      // 3. その事業の専用メンバーを取得
      const businessMembers = await this.getBusinessMembers(businessId)

      // 4. コアメンバー以外の事業メンバーを抽出
      const coreIds = new Set(coreMembers.map(m => m.id))
      const exclusiveBusinessMembers = businessMembers.filter(m => !coreIds.has(m.id))

      return {
        business_id: businessId,
        core_members: coreMembers,
        business_members: exclusiveBusinessMembers
      }
    } catch (error) {
      console.error('事業メンバーリスト取得エラー:', error)
      return {
        business_id: businessId,
        core_members: [],
        business_members: []
      }
    }
  }

  /**
   * メンバーを作成
   */
  static async createMember(member: CreateMemberRequest): Promise<Member | null> {
    try {
      const memberData: MemberInsert = {
        company_id: member.company_id || 'default-company',
        name: member.name,
        email: member.email,
        permission: member.permission,
        member_type: member.member_type
      }

      const { data, error } = await supabase
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (error) {
        console.error('メンバー作成エラー:', error)
        return null
      }

      return this.convertRowToMember(data)
    } catch (error) {
      console.error('メンバー作成例外:', error)
      return null
    }
  }

  /**
   * メンバーを更新
   */
  static async updateMember(id: string, updates: UpdateMemberRequest): Promise<Member | null> {
    try {
      const updateData: MemberUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('メンバー更新エラー:', error)
        return null
      }

      return this.convertRowToMember(data)
    } catch (error) {
      console.error('メンバー更新例外:', error)
      return null
    }
  }

  /**
   * メンバーを削除
   */
  static async deleteMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('メンバー削除エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー削除例外:', error)
      return false
    }
  }

  // ============================================
  // メンバー⇄事業関係の操作
  // ============================================

  /**
   * メンバーの所属事業を取得
   */
  static async getMemberBusinesses(memberId: string): Promise<MemberBusiness[]> {
    try {
      const { data, error } = await supabase
        .from('member_businesses')
        .select('*')
        .eq('member_id', memberId)

      if (error) {
        console.error('メンバー事業関係取得エラー:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('メンバー事業関係取得例外:', error)
      return []
    }
  }

  /**
   * メンバーと事業の関係を追加
   */
  static async addMemberBusinessRelation(memberId: string, businessId: string): Promise<boolean> {
    try {
      const relationData: MemberBusinessInsert = {
        member_id: memberId,
        business_id: businessId
      }

      const { error } = await supabase
        .from('member_businesses')
        .insert(relationData)

      if (error) {
        console.error('メンバー事業関係追加エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー事業関係追加例外:', error)
      return false
    }
  }

  /**
   * メンバーと事業の関係を一括追加
   */
  static async addMemberBusinessRelations(relations: Array<{
    member_id: string
    business_id: string
  }>): Promise<boolean> {
    try {
      const relationData: MemberBusinessInsert[] = relations.map(rel => ({
        member_id: rel.member_id,
        business_id: rel.business_id
      }))

      const { error } = await supabase
        .from('member_businesses')
        .insert(relationData)

      if (error) {
        console.error('メンバー事業関係一括追加エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー事業関係一括追加例外:', error)
      return false
    }
  }

  /**
   * メンバーの事業関係をすべて削除
   */
  static async removeMemberBusinessRelations(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('member_businesses')
        .delete()
        .eq('member_id', memberId)

      if (error) {
        console.error('メンバー事業関係削除エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー事業関係削除例外:', error)
      return false
    }
  }

  // ============================================
  // メンバー役割の操作
  // ============================================

  /**
   * メンバーの組織図役割を取得
   */
  static async getMemberRoles(memberId: string): Promise<MemberRole[]> {
    try {
      const { data, error } = await supabase
        .from('member_roles')
        .select('*')
        .eq('member_id', memberId)

      if (error) {
        console.error('メンバー役割取得エラー:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('メンバー役割取得例外:', error)
      return []
    }
  }

  /**
   * メンバーに役割を追加
   */
  static async addMemberRole(role: Omit<MemberRole, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const roleData: MemberRoleInsert = {
        member_id: role.member_id,
        role_type: role.role_type,
        reference_id: role.reference_id
      }

      const { error } = await supabase
        .from('member_roles')
        .insert(roleData)

      if (error) {
        console.error('メンバー役割追加エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー役割追加例外:', error)
      return false
    }
  }

  /**
   * メンバーの特定役割を削除
   */
  static async removeMemberRole(
    memberId: string, 
    roleType: string, 
    referenceId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('member_roles')
        .delete()
        .eq('member_id', memberId)
        .eq('role_type', roleType)
        .eq('reference_id', referenceId)

      if (error) {
        console.error('メンバー役割削除エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー役割削除例外:', error)
      return false
    }
  }

  /**
   * メンバーのすべての役割を削除
   */
  static async removeAllMemberRoles(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('member_roles')
        .delete()
        .eq('member_id', memberId)

      if (error) {
        console.error('メンバー全役割削除エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('メンバー全役割削除例外:', error)
      return false
    }
  }

  // ============================================
  // ユーティリティ関数
  // ============================================

  /**
   * 会社の全事業IDを取得
   */
  static async getAllBusinessIds(companyId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('company_id', companyId)

      if (error) {
        console.error('事業ID取得エラー:', error)
        return []
      }

      return data.map(business => business.id)
    } catch (error) {
      console.error('事業ID取得例外:', error)
      return []
    }
  }

  /**
   * データベース行をMember型に変換
   */
  private static convertRowToMember(row: MemberRow): Member {
    return {
      id: row.id,
      company_id: row.company_id,
      name: row.name,
      email: row.email,
      permission: row.permission as any,
      member_type: row.member_type as any,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}

// 型の拡張（一時的）
declare module '@/types' {
  interface CreateMemberRequest {
    company_id?: string
  }
}