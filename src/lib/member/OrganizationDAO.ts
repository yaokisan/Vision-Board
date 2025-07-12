/**
 * 組織図データアクセスオブジェクト（DAO）
 * 組織図関連のSupabaseデータベース操作を担当
 */

import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { Position, Business, Task } from '@/types'

type PositionRow = Database['public']['Tables']['positions']['Row']
type PositionUpdate = Database['public']['Tables']['positions']['Update']

type BusinessRow = Database['public']['Tables']['businesses']['Row']
type BusinessUpdate = Database['public']['Tables']['businesses']['Update']

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export class OrganizationDAO {
  // ============================================
  // 経営層（Position）の操作
  // ============================================

  /**
   * 役職の現在の担当者を取得
   */
  static async getCurrentPositionMember(positionId: string): Promise<{
    member_id: string | null
    person_name: string | null
  } | null> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('member_id, person_name')
        .eq('id', positionId)
        .single()

      if (error) {
        console.error('役職担当者取得エラー:', error)
        return null
      }

      return {
        member_id: data.member_id,
        person_name: data.person_name
      }
    } catch (error) {
      console.error('役職担当者取得例外:', error)
      return null
    }
  }

  /**
   * 役職の担当者を更新
   */
  static async updatePositionMember(positionId: string, memberId: string | null): Promise<boolean> {
    try {
      // メンバー名を取得
      let memberName = null
      if (memberId) {
        const { data: memberData } = await supabase
          .from('members')
          .select('name')
          .eq('id', memberId)
          .single()
        
        memberName = memberData?.name
      }

      const updateData: PositionUpdate = {
        member_id: memberId,
        person_name: memberName,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('positions')
        .update(updateData)
        .eq('id', positionId)

      if (error) {
        console.error('役職担当者更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('役職担当者更新例外:', error)
      return false
    }
  }

  /**
   * 会社の全役職を取得
   */
  static async getPositionsByCompany(companyId: string): Promise<Position[]> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('役職一覧取得エラー:', error)
        return []
      }

      return data.map(this.convertRowToPosition)
    } catch (error) {
      console.error('役職一覧取得例外:', error)
      return []
    }
  }

  // ============================================
  // 事業（Business）の操作
  // ============================================

  /**
   * 事業の現在の責任者を取得
   */
  static async getCurrentBusinessManager(businessId: string): Promise<{
    member_id: string | null
    person_name: string | null
  } | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('responsible_person_id, responsible_person')
        .eq('id', businessId)
        .single()

      if (error) {
        console.error('事業責任者取得エラー:', error)
        return null
      }

      return {
        member_id: data.responsible_person_id,
        person_name: data.responsible_person
      }
    } catch (error) {
      console.error('事業責任者取得例外:', error)
      return null
    }
  }

  /**
   * 事業の責任者を更新
   */
  static async updateBusinessResponsiblePerson(businessId: string, memberId: string | null): Promise<boolean> {
    try {
      // メンバー名を取得
      let memberName = null
      if (memberId) {
        const { data: memberData } = await supabase
          .from('members')
          .select('name')
          .eq('id', memberId)
          .single()
        
        memberName = memberData?.name
      }

      const updateData: BusinessUpdate = {
        responsible_person_id: memberId,
        responsible_person: memberName,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId)

      if (error) {
        console.error('事業責任者更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('事業責任者更新例外:', error)
      return false
    }
  }

  /**
   * 会社の全事業を取得
   */
  static async getBusinessesByCompany(companyId: string): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          layers!businesses_layer_id_fkey(company_id)
        `)
        .eq('layers.company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('事業一覧取得エラー:', error)
        return []
      }

      return data.map(this.convertRowToBusiness)
    } catch (error) {
      console.error('事業一覧取得例外:', error)
      return []
    }
  }

  /**
   * 事業名を取得
   */
  static async getBusinessName(businessId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single()

      if (error) {
        console.error('事業名取得エラー:', error)
        return `事業-${businessId}`
      }

      return data.name
    } catch (error) {
      console.error('事業名取得例外:', error)
      return `事業-${businessId}`
    }
  }

  // ============================================
  // 業務（Task）の操作
  // ============================================

  /**
   * 業務の現在の責任者を取得
   */
  static async getCurrentTaskManager(taskId: string): Promise<{
    member_id: string | null
    person_name: string | null
  } | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('responsible_person_id, responsible_person')
        .eq('id', taskId)
        .single()

      if (error) {
        console.error('業務責任者取得エラー:', error)
        return null
      }

      return {
        member_id: data.responsible_person_id,
        person_name: data.responsible_person
      }
    } catch (error) {
      console.error('業務責任者取得例外:', error)
      return null
    }
  }

  /**
   * 業務の責任者を更新
   */
  static async updateTaskResponsiblePerson(taskId: string, memberId: string | null): Promise<boolean> {
    try {
      // メンバー名を取得
      let memberName = null
      if (memberId) {
        const { data: memberData } = await supabase
          .from('members')
          .select('name')
          .eq('id', memberId)
          .single()
        
        memberName = memberData?.name
      }

      const updateData: TaskUpdate = {
        responsible_person_id: memberId,
        responsible_person: memberName,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) {
        console.error('業務責任者更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('業務責任者更新例外:', error)
      return false
    }
  }

  /**
   * 会社の全業務を取得
   */
  static async getTasksByCompany(companyId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          layers!inner(company_id)
        `)
        .eq('layers.company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('業務一覧取得エラー:', error)
        return []
      }

      return data.map(this.convertRowToTask)
    } catch (error) {
      console.error('業務一覧取得例外:', error)
      return []
    }
  }

  /**
   * 業務名を取得
   */
  static async getTaskName(taskId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('name')
        .eq('id', taskId)
        .single()

      if (error) {
        console.error('業務名取得エラー:', error)
        return `業務-${taskId}`
      }

      return data.name
    } catch (error) {
      console.error('業務名取得例外:', error)
      return `業務-${taskId}`
    }
  }

  // ============================================
  // カスケード更新メソッド（メンバー名変更用）
  // ============================================

  /**
   * 役職の person_name をメンバーIDで一括更新
   */
  static async updatePositionPersonName(memberId: string, newName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('positions')
        .update({ 
          person_name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('member_id', memberId)

      if (error) {
        console.error('役職名前更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('役職名前更新例外:', error)
      return false
    }
  }

  /**
   * 事業の responsible_person をメンバーIDで一括更新
   */
  static async updateBusinessResponsiblePersonName(memberId: string, newName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          responsible_person: newName,
          updated_at: new Date().toISOString()
        })
        .eq('responsible_person_id', memberId)

      if (error) {
        console.error('事業責任者名前更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('事業責任者名前更新例外:', error)
      return false
    }
  }

  /**
   * 業務の responsible_person をメンバーIDで一括更新
   */
  static async updateTaskResponsiblePersonName(memberId: string, newName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          responsible_person: newName,
          updated_at: new Date().toISOString()
        })
        .eq('responsible_person_id', memberId)

      if (error) {
        console.error('業務責任者名前更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('業務責任者名前更新例外:', error)
      return false
    }
  }

  /**
   * 実行者の name をメンバーIDで一括更新
   */
  static async updateExecutorName(memberId: string, newName: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('executors')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('member_id', memberId)

      if (error) {
        console.error('実行者名前更新エラー:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('実行者名前更新例外:', error)
      return false
    }
  }

  // ============================================
  // 参照先名前の取得（汎用）
  // ============================================

  /**
   * 役割参照先の名前を取得
   */
  static async getRoleReferenceName(roleType: string, referenceId: string): Promise<string> {
    try {
      switch (roleType) {
        case 'position':
          const { data: positionData } = await supabase
            .from('positions')
            .select('name')
            .eq('id', referenceId)
            .single()
          return positionData?.name || `役職-${referenceId}`

        case 'business_manager':
          return await this.getBusinessName(referenceId)

        case 'task_manager':
          return await this.getTaskName(referenceId)

        default:
          return `不明-${referenceId}`
      }
    } catch (error) {
      console.error('参照先名前取得エラー:', error)
      return `参照先-${referenceId}`
    }
  }

  // ============================================
  // データ変換ユーティリティ
  // ============================================

  /**
   * データベース行をPosition型に変換
   */
  private static convertRowToPosition(row: PositionRow): Position {
    return {
      id: row.id,
      company_id: row.company_id,
      name: row.name as ('CEO' | 'CTO' | 'CFO' | 'COO'),
      member_id: row.member_id ?? undefined,
      person_name: row.person_name ?? '',
      position_x: row.position_x,
      position_y: row.position_y,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  /**
   * データベース行をBusiness型に変換
   */
  private static convertRowToBusiness(row: any): Business {
    return {
      id: row.id,
      company_id: row.company_id,
      name: row.name,
      goal: row.goal || '',
      responsible_person_id: row.responsible_person_id,
      responsible_person: row.responsible_person || '',
      category: row.category,
      position_x: row.position_x,
      position_y: row.position_y,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  /**
   * データベース行をTask型に変換
   */
  private static convertRowToTask(row: any): Task {
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      goal: row.goal || '',
      responsible_person_id: row.responsible_person_id,
      responsible_person: row.responsible_person || '',
      group_name: row.group_name,
      position_x: row.position_x,
      position_y: row.position_y,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}