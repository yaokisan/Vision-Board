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

    // 1. タスクのbusiness_idを取得
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('business_id')
      .eq('id', taskUuid)
      .single()

    if (taskError) {
      throw new Error(`Failed to fetch task data: ${taskError.message}`)
    }

    // 2. 実行者のbusiness_idとtask_idを更新
    const { error: executorError } = await supabase
      .from('executors')
      .update({ 
        business_id: taskData.business_id,
        task_id: taskUuid,
        updated_at: new Date().toISOString()
      })
      .eq('id', executorUuid)

    if (executorError) {
      throw new Error(`Failed to update executor: ${executorError.message}`)
    }

    console.log(`✅ Updated executor ${executorUuid}: business_id=${taskData.business_id}, task_id=${taskUuid}`)
    return [executorId]
  }

  /**
   * task → task: 子業務のbusiness_idを親業務のbusiness_idに設定
   */
  private static async handleTaskToTask(parentTaskId: string, childTaskId: string): Promise<string[]> {
    const parentUuid = this.extractUuid(parentTaskId)
    const childUuid = this.extractUuid(childTaskId)

    // 1. 親タスクのbusiness_idを取得
    const { data: parentData, error: parentError } = await supabase
      .from('tasks')
      .select('business_id')
      .eq('id', parentUuid)
      .single()

    if (parentError) {
      throw new Error(`Failed to fetch parent task data: ${parentError.message}`)
    }

    // 2. 子タスクのbusiness_idを更新（task_idは自身のIDのまま）
    const { error: childError } = await supabase
      .from('tasks')
      .update({ 
        business_id: parentData.business_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', childUuid)

    if (childError) {
      throw new Error(`Failed to update child task: ${childError.message}`)
    }

    console.log(`✅ Updated child task ${childUuid} business_id to ${parentData.business_id}`)
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
   * ノードIDからUUIDを抽出
   */
  private static extractUuid(nodeId: string): string {
    return nodeId.split('-').slice(1).join('-')
  }
}