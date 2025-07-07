import { supabase } from '@/lib/supabase/client'
import { NodeType } from '@/types/flow'
import { v4 as uuidv4 } from 'uuid'

export interface NodeSaveData {
  nodeType: NodeType
  data: any
  position: { x: number; y: number }
  parentNodeId?: string
  companyId: string
}

export class NodeDataService {
  /**
   * 新規ノードをデータベースに保存
   */
  static async saveNewNode(nodeData: NodeSaveData): Promise<{ success: boolean; nodeId?: string; error?: string }> {
    try {
      const nodeId = uuidv4()
      
      switch (nodeData.nodeType) {
        case NodeType.CXO:
          return await this.savePosition(nodeData, nodeId)
          
        case NodeType.BUSINESS:
          return await this.saveBusiness(nodeData, nodeId)
          
        case NodeType.TASK:
          return await this.saveTask(nodeData, nodeId)
          
        case NodeType.EXECUTOR:
          return await this.saveExecutor(nodeData, nodeId)
          
        case NodeType.BUSINESS_LAYER:
          return await this.saveLayer(nodeData, nodeId)
          
        default:
          return { success: false, error: `Unsupported node type: ${nodeData.nodeType}` }
      }
    } catch (error) {
      console.error('Node save error:', error)
      return { success: false, error: 'Failed to save node' }
    }
  }

  /**
   * 役職ノード保存
   */
  private static async savePosition(nodeData: NodeSaveData, nodeId: string) {
    const { error } = await supabase
      .from('positions')
      .insert({
        id: nodeId,
        company_id: nodeData.companyId,
        name: nodeData.data.name || 'New Position',
        person_name: nodeData.data.person_name || '',
        attribute: nodeData.data.attribute === 'company' ? null : nodeData.data.attribute,
        position_x: nodeData.position.x,
        position_y: nodeData.position.y,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Position save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nodeId }
  }

  /**
   * 事業ノード保存
   */
  private static async saveBusiness(nodeData: NodeSaveData, nodeId: string) {
    // layer_id を親ノードから取得、なければデフォルトレイヤーを作成
    let layerId = this.extractLayerIdFromParent(nodeData.parentNodeId)
    
    if (!layerId) {
      // デフォルトレイヤーを取得または作成
      const defaultLayerResult = await this.getOrCreateDefaultLayer(nodeData.companyId)
      if (!defaultLayerResult.success) {
        return { success: false, error: `Failed to create default layer: ${defaultLayerResult.error}` }
      }
      layerId = defaultLayerResult.layerId!
    }
    
    // 事業ノードの属性は自分自身のIDに設定（事業属性を作成）
    const businessAttribute = nodeId // 事業ノードは常に自分自身のIDを属性にする
    
    const { error } = await supabase
      .from('businesses')
      .insert({
        id: nodeId,
        layer_id: layerId,
        name: nodeData.data.name || 'New Business',
        goal: nodeData.data.goal || '',
        responsible_person: nodeData.data.responsible_person || '',
        category: nodeData.data.category || '',
        attribute: businessAttribute,
        position_x: nodeData.position.x,
        position_y: nodeData.position.y,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Business save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nodeId }
  }

  /**
   * 業務ノード保存
   */
  private static async saveTask(nodeData: NodeSaveData, nodeId: string) {
    // business_id または layer_id を親ノードから取得
    let { businessId, layerId } = this.extractTaskParentIds(nodeData.parentNodeId)
    
    // 親が指定されていない場合はデフォルトレイヤーを使用
    if (!businessId && !layerId) {
      const defaultLayerResult = await this.getOrCreateDefaultLayer(nodeData.companyId)
      if (!defaultLayerResult.success) {
        return { success: false, error: `Failed to create default layer: ${defaultLayerResult.error}` }
      }
      layerId = defaultLayerResult.layerId!
    }
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        id: nodeId,
        business_id: businessId,
        layer_id: layerId,
        name: nodeData.data.name || 'New Task',
        goal: nodeData.data.goal || '',
        responsible_person: nodeData.data.responsible_person || '',
        group_name: nodeData.data.group_name || '',
        attribute: nodeData.data.attribute === 'company' ? null : nodeData.data.attribute,
        position_x: nodeData.position.x,
        position_y: nodeData.position.y,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Task save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nodeId }
  }

  /**
   * 実行者ノード保存
   */
  private static async saveExecutor(nodeData: NodeSaveData, nodeId: string) {
    // task_id を親ノードから取得
    const taskId = this.extractTaskIdFromParent(nodeData.parentNodeId)
    
    const { error } = await supabase
      .from('executors')
      .insert({
        id: nodeId,
        task_id: taskId,
        name: nodeData.data.name || 'New Executor',
        role: nodeData.data.role || '',
        attribute: nodeData.data.attribute === 'company' ? null : nodeData.data.attribute,
        position_x: nodeData.position.x,
        position_y: nodeData.position.y,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Executor save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nodeId }
  }

  /**
   * レイヤーノード保存
   */
  private static async saveLayer(nodeData: NodeSaveData, nodeId: string) {
    const { error } = await supabase
      .from('layers')
      .insert({
        id: nodeId,
        company_id: nodeData.companyId,
        name: nodeData.data.name || nodeData.data.title || 'New Layer',
        type: nodeData.data.type || 'business',
        attribute: nodeData.data.attribute === 'company' ? null : nodeData.data.attribute,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Layer save error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nodeId }
  }

  /**
   * 親ノードIDからlayer_idを抽出
   */
  private static extractLayerIdFromParent(parentNodeId?: string): string | null {
    if (!parentNodeId) return null
    
    if (parentNodeId.startsWith('layer-')) {
      return parentNodeId.replace('layer-', '')
    }
    
    return null
  }

  /**
   * 親ノードIDからbusiness_idとlayer_idを抽出
   */
  private static extractTaskParentIds(parentNodeId?: string): { businessId: string | null; layerId: string | null } {
    if (!parentNodeId) return { businessId: null, layerId: null }
    
    if (parentNodeId.startsWith('business-')) {
      return { businessId: parentNodeId.replace('business-', ''), layerId: null }
    }
    
    if (parentNodeId.startsWith('layer-')) {
      return { businessId: null, layerId: parentNodeId.replace('layer-', '') }
    }
    
    return { businessId: null, layerId: null }
  }

  /**
   * 親ノードIDからtask_idを抽出
   */
  private static extractTaskIdFromParent(parentNodeId?: string): string | null {
    if (!parentNodeId) return null
    
    if (parentNodeId.startsWith('task-')) {
      return parentNodeId.replace('task-', '')
    }
    
    return null
  }

  /**
   * デフォルトレイヤーを取得または作成
   */
  private static async getOrCreateDefaultLayer(companyId: string): Promise<{ success: boolean; layerId?: string; error?: string }> {
    try {
      // 既存のレイヤーを確認
      const { data: existingLayers, error: selectError } = await supabase
        .from('layers')
        .select('id')
        .eq('company_id', companyId)
        .limit(1)

      if (selectError) {
        console.error('Layer select error:', selectError)
        return { success: false, error: selectError.message }
      }

      if (existingLayers && existingLayers.length > 0) {
        return { success: true, layerId: existingLayers[0].id }
      }

      // デフォルトレイヤーを作成
      const layerId = uuidv4()
      const { error: insertError } = await supabase
        .from('layers')
        .insert({
          id: layerId,
          company_id: companyId,
          name: 'デフォルト事業レイヤー',
          type: 'business',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Default layer creation error:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ DEFAULT LAYER CREATED:', layerId)
      return { success: true, layerId }
    } catch (error) {
      console.error('Default layer creation exception:', error)
      return { success: false, error: 'Failed to create default layer' }
    }
  }

  /**
   * 既存ノードをデータベースで更新
   */
  static async updateNode(nodeId: string, updatedData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // ノードIDからテーブルとIDを判定
      const { table, id } = this.parseNodeId(nodeId)
      
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      console.log('💾 UPDATING NODE:', { table, id, updatedData })

      let updateQuery
      const timestamp = new Date().toISOString()

      switch (table) {
        case 'positions':
          updateQuery = supabase
            .from('positions')
            .update({
              name: updatedData.name,
              person_name: updatedData.person_name,
              member_id: updatedData.member_id,
              attribute: updatedData.attribute,
              updated_at: timestamp
            })
            .eq('id', id)
          break

        case 'businesses':
          updateQuery = supabase
            .from('businesses')
            .update({
              name: updatedData.name,
              goal: updatedData.goal,
              responsible_person: updatedData.responsible_person,
              responsible_person_id: updatedData.responsible_person_id,
              category: updatedData.category,
              attribute: updatedData.attribute,
              updated_at: timestamp
            })
            .eq('id', id)
          break

        case 'tasks':
          updateQuery = supabase
            .from('tasks')
            .update({
              name: updatedData.name,
              goal: updatedData.goal,
              responsible_person: updatedData.responsible_person,
              responsible_person_id: updatedData.responsible_person_id,
              group_name: updatedData.group_name,
              attribute: updatedData.attribute,
              updated_at: timestamp
            })
            .eq('id', id)
          break

        case 'executors':
          updateQuery = supabase
            .from('executors')
            .update({
              name: updatedData.name,
              role: updatedData.role,
              task_id: updatedData.task_id,
              attribute: updatedData.attribute,
              updated_at: timestamp
            })
            .eq('id', id)
          break

        case 'layers':
          // undefinedの値を除外してオブジェクトを構築
          const layerUpdateData: any = {
            updated_at: timestamp
          }
          
          if (updatedData.name !== undefined) layerUpdateData.name = updatedData.name
          if (updatedData.type !== undefined) layerUpdateData.type = updatedData.type
          if (updatedData.description !== undefined) layerUpdateData.description = updatedData.description
          if (updatedData.color !== undefined) layerUpdateData.color = updatedData.color
          if (updatedData.attribute !== undefined) layerUpdateData.attribute = updatedData.attribute
          if (updatedData.containerSize?.width !== undefined) layerUpdateData.width = updatedData.containerSize.width
          if (updatedData.containerSize?.height !== undefined) layerUpdateData.height = updatedData.containerSize.height
          
          updateQuery = supabase
            .from('layers')
            .update(layerUpdateData)
            .eq('id', id)
          break

        case 'companies':
          updateQuery = supabase
            .from('companies')
            .update({
              name: updatedData.name,
              attribute: updatedData.attribute,
              updated_at: timestamp
            })
            .eq('id', id)
          break

        default:
          return { success: false, error: `Unsupported table: ${table}` }
      }

      const { error } = await updateQuery

      if (error) {
        console.error('Node update error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ NODE UPDATED IN DATABASE:', { table, id })
      return { success: true }
    } catch (error) {
      console.error('Node update exception:', error)
      return { success: false, error: 'Failed to update node' }
    }
  }

  /**
   * ノードIDをパースしてテーブル名とIDを取得
   */
  private static parseNodeId(nodeId: string): { table: string | null; id: string | null } {
    const parts = nodeId.split('-')
    
    if (parts.length < 2) {
      return { table: null, id: null }
    }

    const prefix = parts[0]
    const id = parts.slice(1).join('-') // UUIDに'-'が含まれる場合に対応

    const tableMap: Record<string, string> = {
      'company': 'companies',
      'position': 'positions',
      'layer': 'layers',
      'business': 'businesses', 
      'task': 'tasks',
      'executor': 'executors'
    }

    const table = tableMap[prefix] || null
    return { table, id }
  }

  /**
   * エッジをデータベースに保存
   */
  static async saveEdge(companyId: string, sourceNodeId: string, targetNodeId: string, edgeData: any): Promise<{ success: boolean; edgeId?: string; error?: string }> {
    try {
      const edgeId = uuidv4()
      
      const { error } = await supabase
        .from('edges')
        .insert({
          id: edgeId,
          company_id: companyId,
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId,
          edge_type: edgeData.type || 'default',
          style: edgeData.style || { stroke: '#4c6ef5', strokeWidth: 2, strokeDasharray: '2,4' },
          animated: edgeData.animated !== undefined ? edgeData.animated : true,
          deletable: edgeData.deletable !== undefined ? edgeData.deletable : true,
          reconnectable: edgeData.reconnectable !== undefined ? edgeData.reconnectable : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Edge save error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ EDGE SAVED TO DATABASE:', { edgeId, sourceNodeId, targetNodeId })
      return { success: true, edgeId }
    } catch (error) {
      console.error('Edge save exception:', error)
      return { success: false, error: 'Failed to save edge' }
    }
  }

  /**
   * エッジをデータベースから削除
   */
  static async deleteEdge(edgeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('edges')
        .delete()
        .eq('id', edgeId)

      if (error) {
        console.error('Edge delete error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ EDGE DELETED FROM DATABASE:', edgeId)
      return { success: true }
    } catch (error) {
      console.error('Edge delete exception:', error)
      return { success: false, error: 'Failed to delete edge' }
    }
  }

  /**
   * エッジを更新（再接続）
   */
  static async updateEdge(edgeId: string, newSourceId: string, newTargetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('edges')
        .update({
          source_node_id: newSourceId,
          target_node_id: newTargetId,
          updated_at: new Date().toISOString()
        })
        .eq('id', edgeId)

      if (error) {
        console.error('Edge update error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ EDGE UPDATED IN DATABASE:', { edgeId, newSourceId, newTargetId })
      return { success: true }
    } catch (error) {
      console.error('Edge update exception:', error)
      return { success: false, error: 'Failed to update edge' }
    }
  }

  /**
   * ノードの属性を取得
   */
  static async getNodeAttribute(nodeId: string): Promise<{ success: boolean; attribute?: string | null; error?: string }> {
    try {
      const { table, id } = this.parseNodeId(nodeId)
      
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      const { data, error } = await supabase
        .from(table)
        .select('attribute')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Get node attribute error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, attribute: data.attribute }
    } catch (error) {
      console.error('Get node attribute exception:', error)
      return { success: false, error: 'Failed to get node attribute' }
    }
  }

  /**
   * ノードの属性を更新
   */
  static async updateNodeAttribute(nodeId: string, attribute: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { table, id } = this.parseNodeId(nodeId)
      
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      const timestamp = new Date().toISOString()

      const { error } = await supabase
        .from(table)
        .update({
          attribute: attribute,
          updated_at: timestamp
        })
        .eq('id', id)

      if (error) {
        console.error('Update node attribute error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ NODE ATTRIBUTE UPDATED:', { nodeId, attribute })
      return { success: true }
    } catch (error) {
      console.error('Update node attribute exception:', error)
      return { success: false, error: 'Failed to update node attribute' }
    }
  }

  /**
   * エッジ作成時の属性継承処理
   */
  static async inheritAttributeFromParent(sourceNodeId: string, targetNodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔗 INHERITING ATTRIBUTE:', { sourceNodeId, targetNodeId })
      
      // 親ノードの属性を取得
      const parentResult = await this.getNodeAttribute(sourceNodeId)
      if (!parentResult.success) {
        return { success: false, error: `Failed to get parent attribute: ${parentResult.error}` }
      }

      // 子ノードの属性を更新
      const updateResult = await this.updateNodeAttribute(targetNodeId, parentResult.attribute)
      if (!updateResult.success) {
        return { success: false, error: `Failed to update child attribute: ${updateResult.error}` }
      }

      console.log('✅ ATTRIBUTE INHERITED:', { 
        parent: sourceNodeId, 
        child: targetNodeId, 
        attribute: parentResult.attribute 
      })
      
      return { success: true }
    } catch (error) {
      console.error('Inherit attribute exception:', error)
      return { success: false, error: 'Failed to inherit attribute' }
    }
  }

  /**
   * エッジ削除時の属性リセット処理
   */
  static async resetNodeAttributeToCompany(nodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 RESETTING ATTRIBUTE TO COMPANY:', nodeId)
      
      const updateResult = await this.updateNodeAttribute(nodeId, null)
      if (!updateResult.success) {
        return { success: false, error: `Failed to reset attribute: ${updateResult.error}` }
      }

      console.log('✅ ATTRIBUTE RESET TO COMPANY:', nodeId)
      return { success: true }
    } catch (error) {
      console.error('Reset attribute exception:', error)
      return { success: false, error: 'Failed to reset attribute' }
    }
  }

  /**
   * 実行者の属性を親業務と同期
   */
  static async syncExecutorAttributeWithTask(executorId: string, taskId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 SYNCING EXECUTOR ATTRIBUTE:', { executorId, taskId })
      
      // 業務ノードの属性を取得
      const taskNodeId = `task-${taskId}`
      const taskResult = await this.getNodeAttribute(taskNodeId)
      if (!taskResult.success) {
        return { success: false, error: `Failed to get task attribute: ${taskResult.error}` }
      }

      // 実行者ノードの属性を更新
      const executorNodeId = `executor-${executorId}`
      const updateResult = await this.updateNodeAttribute(executorNodeId, taskResult.attribute)
      if (!updateResult.success) {
        return { success: false, error: `Failed to update executor attribute: ${updateResult.error}` }
      }

      console.log('✅ EXECUTOR ATTRIBUTE SYNCED:', { 
        executor: executorNodeId, 
        task: taskNodeId, 
        attribute: taskResult.attribute 
      })
      
      return { success: true }
    } catch (error) {
      console.error('Sync executor attribute exception:', error)
      return { success: false, error: 'Failed to sync executor attribute' }
    }
  }
}