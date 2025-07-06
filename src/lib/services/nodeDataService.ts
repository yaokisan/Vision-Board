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
    
    const { error } = await supabase
      .from('businesses')
      .insert({
        id: nodeId,
        layer_id: layerId,
        name: nodeData.data.name || 'New Business',
        goal: nodeData.data.goal || '',
        responsible_person: nodeData.data.responsible_person || '',
        category: nodeData.data.category || '',
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
}