/**
 * 組織図データ取得サービス
 * Supabaseから組織図用のデータを取得
 */

import { supabase } from '@/lib/supabase/client'
import { Member, Company, Position, Layer, Business, Task, Executor } from '@/types'

export interface OrganizationData {
  members: Member[]
  companies: Company[]
  positions: Position[]
  layers: Layer[]
  businesses: Business[]
  tasks: Task[]
  executors: Executor[]
}

export class OrganizationDataService {
  /**
   * 現在のユーザーの会社に関連する全組織データを取得
   */
  static async fetchOrganizationData(currentUser: Member): Promise<OrganizationData> {
    try {
      // 同じ会社のメンバーを取得
      const { data: members } = await supabase
        .from('members')
        .select('*')
        .eq('company_id', currentUser.company_id)

      // 会社情報を取得
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('id', currentUser.company_id)

      // 役職情報を取得
      const { data: positions } = await supabase
        .from('positions')
        .select('*')
        .eq('company_id', currentUser.company_id)

      // レイヤー情報を取得
      const { data: layers } = await supabase
        .from('layers')
        .select('*')
        .eq('company_id', currentUser.company_id)

      // 事業情報を取得（新構造: 独立ノード）
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('company_id', currentUser.company_id)

      // 業務情報を取得（business_id=nullのドラッグ&ドロップタスクも含める）
      const businessIds = businesses?.map(b => b.id) || []
      let tasksData: Task[] = []
      
      if (businessIds.length > 0) {
        // 事業に紐づくタスクを取得
        const { data: businessTasks } = await supabase
          .from('tasks')
          .select('*')
          .in('business_id', businessIds)
        tasksData = [...(businessTasks || [])]
      }
      
      // business_id=nullのタスクを取得
      const { data: nullTasks } = await supabase
        .from('tasks')
        .select('*')
        .is('business_id', null)
      
      tasksData = [...tasksData, ...(nullTasks || [])]
      const tasks = tasksData

      // 実行者情報を取得（task_id=nullのドラッグ&ドロップ実行者も含める）
      const taskIds = tasks?.map(t => t.id) || []
      let executorsData: Executor[] = []
      
      if (taskIds.length > 0) {
        // タスクに紐づく実行者を取得
        const { data: taskExecutors } = await supabase
          .from('executors')
          .select('*')
          .in('task_id', taskIds)
        executorsData = [...(taskExecutors || [])]
      }
      
      // task_id=nullの実行者を取得（ドラッグ&ドロップ）
      const { data: nullExecutors } = await supabase
        .from('executors')
        .select('*')
        .is('task_id', null)
      
      executorsData = [...executorsData, ...(nullExecutors || [])]
      const executors = executorsData

      return {
        members: members || [],
        companies: companies || [],
        positions: positions || [],
        layers: layers || [],
        businesses: businesses || [],
        tasks: tasks || [],
        executors: executors || []
      }
    } catch (error) {
      console.error('組織データ取得エラー:', error)
      
      // エラー時は空のデータを返す
      return {
        members: [],
        companies: [],
        positions: [],
        layers: [],
        businesses: [],
        tasks: [],
        executors: []
      }
    }
  }

  /**
   * データが空かどうかをチェック
   */
  static isEmpty(data: OrganizationData): boolean {
    return data.companies.length === 0 && 
           data.positions.length === 0 && 
           data.layers.length === 0 && 
           data.businesses.length === 0 && 
           data.tasks.length === 0 && 
           data.executors.length === 0
  }

  /**
   * デモ用の最小限データを生成
   */
  static generateMinimalDemoData(currentUser: Member): OrganizationData {
    return {
      members: [currentUser],
      companies: [{
        id: currentUser.company_id,
        name: 'My Company',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }],
      positions: [],
      layers: [],
      businesses: [],
      tasks: [],
      executors: []
    }
  }
}