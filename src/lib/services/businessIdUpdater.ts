/**
 * business_id自動更新サービス
 * エッジ接続時のbusiness_id継承とカスケード更新を管理
 */

import { supabase } from '@/lib/supabase/client'
import { EdgeConnectionValidator, NodeType } from './edgeConnectionValidator'

interface UpdateResult {
  success: boolean
  updatedNodes?: string[]
  error?: string
}

export class BusinessIdUpdater {
  // business_id取得のキャッシュ
  private static businessIdCache = new Map<string, string>()
  
  /**
   * エッジ接続時のbusiness_id自動更新
   */
  static async updateBusinessIdOnConnection(
    sourceNodeId: string, 
    targetNodeId: string
  ): Promise<UpdateResult> {
    try {
      const sourceType = EdgeConnectionValidator.getNodeTypeFromId(sourceNodeId)
      const targetType = EdgeConnectionValidator.getNodeTypeFromId(targetNodeId)

      if (!sourceType || !targetType) {
        return { success: false, error: 'Invalid node types' }
      }

      let updatedNodes: string[] = []

      switch (`${sourceType}_${targetType}`) {
        case `${NodeType.BUSINESS}_${NodeType.TASK}`:
          updatedNodes = await this.handleBusinessToTask(sourceNodeId, targetNodeId)
          break
        
        case `${NodeType.TASK}_${NodeType.EXECUTOR}`:
          updatedNodes = await this.handleTaskToExecutor(sourceNodeId, targetNodeId)
          break
        
        case `${NodeType.TASK}_${NodeType.TASK}`:
          updatedNodes = await this.handleTaskToTask(sourceNodeId, targetNodeId)
          break
        
        default:
          // その他のパターンは business_id 更新なし
          return { success: true, updatedNodes: [] }
      }

      return { success: true, updatedNodes }
    } catch (error) {
      console.error('Business ID update error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * business → task: 業務のbusiness_idを事業IDに設定
   */
  private static async handleBusinessToTask(businessId: string, taskId: string): Promise<string[]> {
    const businessUuid = this.extractUuid(businessId)
    const taskUuid = this.extractUuid(taskId)

    const { error } = await supabase
      .from('tasks')
      .update({ 
        business_id: businessUuid,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskUuid)

    if (error) {
      throw new Error(`Failed to update task business_id: ${error.message}`)
    }

    console.log(`✅ Updated task ${taskUuid} business_id to ${businessUuid}`)
    return [taskId]
  }

  /**
   * task → executor: 実行者のbusiness_idとtask_idを設定
   */
  private static async handleTaskToExecutor(taskId: string, executorId: string): Promise<string[]> {
    const taskUuid = this.extractUuid(taskId)
    const executorUuid = this.extractUuid(executorId)

    // 1. タスクのbusiness_idを取得（キャッシュ利用）
    const businessId = await this.getTaskBusinessId(taskUuid)

    // 2. 実行者のbusiness_idとtask_idを更新
    const { error: executorError } = await supabase
      .from('executors')
      .update({ 
        business_id: businessId,
        task_id: taskUuid,
        updated_at: new Date().toISOString()
      })
      .eq('id', executorUuid)

    if (executorError) {
      throw new Error(`Failed to update executor: ${executorError.message}`)
    }

    console.log(`✅ Updated executor ${executorUuid}: business_id=${businessId}, task_id=${taskUuid}`)
    return [executorId]
  }

  /**
   * task → task: 子業務のbusiness_idを親業務のbusiness_idに設定
   */
  private static async handleTaskToTask(parentTaskId: string, childTaskId: string): Promise<string[]> {
    const parentUuid = this.extractUuid(parentTaskId)
    const childUuid = this.extractUuid(childTaskId)

    // 1. 親タスクのbusiness_idを取得（キャッシュ利用）
    const businessId = await this.getTaskBusinessId(parentUuid)

    // 2. 子タスクのbusiness_idを更新（task_idは自身のIDのまま）
    const { error: childError } = await supabase
      .from('tasks')
      .update({ 
        business_id: businessId,
        updated_at: new Date().toISOString()
      })
      .eq('id', childUuid)

    if (childError) {
      throw new Error(`Failed to update child task: ${childError.message}`)
    }

    console.log(`✅ Updated child task ${childUuid} business_id to ${businessId}`)
    return [childTaskId]
  }

  /**
   * エッジ削除時のbusiness_id維持（何もしない）
   * 要件：エッジ削除時はbusiness_idをNULLにせず維持する
   */
  static async handleEdgeDeletion(
    sourceNodeId: string, 
    targetNodeId: string
  ): Promise<UpdateResult> {
    console.log(`ℹ️ Edge deletion: Maintaining business_id for ${targetNodeId}`)
    // エッジ削除時はbusiness_idを維持（何もしない）
    return { success: true, updatedNodes: [] }
  }

  /**
   * データ上の関係のみ存在する場合の上書き処理
   */
  static async handleDataRelationshipOverride(
    sourceNodeId: string, 
    targetNodeId: string
  ): Promise<UpdateResult> {
    console.log(`🔄 Overriding data relationship: ${sourceNodeId} → ${targetNodeId}`)
    // 通常の接続処理と同じ（上書き）
    return this.updateBusinessIdOnConnection(sourceNodeId, targetNodeId)
  }

  /**
   * タスクのbusiness_idを取得（キャッシュ機能付き）
   */
  private static async getTaskBusinessId(taskUuid: string): Promise<string> {
    // キャッシュから取得を試行
    if (this.businessIdCache.has(taskUuid)) {
      return this.businessIdCache.get(taskUuid)!
    }

    // データベースから取得
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('business_id')
      .eq('id', taskUuid)
      .single()

    if (taskError) {
      throw new Error(`Failed to fetch task data: ${taskError.message}`)
    }

    // キャッシュに保存
    this.businessIdCache.set(taskUuid, taskData.business_id)
    return taskData.business_id
  }

  /**
   * 複数ノードの一括business_id更新
   */
  static async updateMultipleNodes(
    updates: Array<{ table: string, id: string, business_id: string, task_id?: string }>
  ): Promise<UpdateResult> {
    try {
      const timestamp = new Date().toISOString()
      const updatedNodes: string[] = []

      // テーブル別にグループ化してバッチ更新
      const updatesByTable = updates.reduce((acc, update) => {
        if (!acc[update.table]) {
          acc[update.table] = []
        }
        acc[update.table].push(update)
        return acc
      }, {} as Record<string, typeof updates>)

      for (const [table, tableUpdates] of Object.entries(updatesByTable)) {
        for (const update of tableUpdates) {
          const updateData: any = { 
            business_id: update.business_id, 
            updated_at: timestamp 
          }
          
          if (update.task_id) {
            updateData.task_id = update.task_id
          }

          const { error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', update.id)

          if (error) {
            throw new Error(`Failed to update ${table} ${update.id}: ${error.message}`)
          }

          updatedNodes.push(`${table}-${update.id}`)
        }
      }

      console.log(`✅ Batch updated ${updatedNodes.length} nodes`)
      return { success: true, updatedNodes }
    } catch (error) {
      console.error('Batch update error:', error)
      return { success: false, error: String(error) }
    }
  }

  /**
   * キャッシュクリア
   */
  static clearCache(): void {
    this.businessIdCache.clear()
    console.log('🧹 BusinessIdUpdater cache cleared')
  }

  /**
   * ノードIDからUUIDを抽出
   */
  private static extractUuid(nodeId: string): string {
    return nodeId.split('-').slice(1).join('-')
  }
}