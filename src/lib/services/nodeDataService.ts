import { supabase } from '@/lib/supabase/client'
import { NodeType } from '@/types/flow'
import { v4 as uuidv4 } from 'uuid'
import { EdgeImpactService } from './edgeImpactService'

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
        member_id: nodeData.data.member_id || null,
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
   * 事業ノード保存（実際のスキーマに合わせて修正）
   */
  private static async saveBusiness(nodeData: NodeSaveData, nodeId: string) {
    const { error } = await supabase
      .from('businesses')
      .insert({
        id: nodeId,
        company_id: nodeData.companyId, // 実際のスキーマに存在
        name: nodeData.data.name || 'New Business',
        goal: nodeData.data.goal || '',
        responsible_person: nodeData.data.responsible_person || '',
        responsible_person_id: nodeData.data.responsible_person_id || null,
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
   * 業務ノード保存（新構造: 必ずbusiness_idを持つ、layer_id削除）
   */
  private static async saveTask(nodeData: NodeSaveData, nodeId: string) {
    // ドラッグ&ドロップ時はnullで作成、エッジ接続時にEdgeImpactServiceで自動設定
    const businessId = this.extractBusinessIdFromParent(nodeData.parentNodeId)
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        id: nodeId,
        business_id: businessId, // 実際のスキーマに存在
        name: nodeData.data.name || 'New Task',
        goal: nodeData.data.goal || '',
        responsible_person: nodeData.data.responsible_person || '',
        responsible_person_id: nodeData.data.responsible_person_id || null,
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
        task_id: taskId, // 実際のスキーマに存在
        name: nodeData.data.name || 'New Executor',
        role: nodeData.data.role || '',
        member_id: nodeData.data.member_id || null, // メンバー参照を追加
        needs_migration: false, // 新規作成データは移行不要
        business_id: this.extractBusinessIdFromParent(nodeData.parentNodeId), // 親ノードからbusiness_idを取得
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
        // business_id削除: layersテーブルには存在しない
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
   * 親ノードIDからbusiness_idを抽出（新構造用）
   */
  private static extractBusinessIdFromParent(parentNodeId?: string): string | null {
    if (!parentNodeId) return null
    
    if (parentNodeId.startsWith('business-')) {
      return parentNodeId.replace('business-', '')
    }
    
    return null
  }

  /**
   * 親ノードIDからbusiness_idとlayer_idを抽出（レガシー、削除予定）
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
        case 'companies':
          // 1. 会社情報を更新
          updateQuery = supabase
            .from('companies')
            .update({
              name: updatedData.name,
              updated_at: timestamp
            })
            .eq('id', id)
          
          // 更新実行
          const { error: companyError } = await updateQuery
          if (companyError) {
            console.error('Company update error:', companyError)
            return { success: false, error: companyError.message }
          }

          // 2. CEO情報を更新/作成
          if (updatedData.person_name) {
            // 既存のCEOポジションを確認
            const { data: existingCeo, error: ceoCheckError } = await supabase
              .from('positions')
              .select('id')
              .eq('company_id', id)
              .eq('name', 'CEO')
              .single()

            if (ceoCheckError && ceoCheckError.code !== 'PGRST116') {
              console.error('CEO check error:', ceoCheckError)
              return { success: false, error: ceoCheckError.message }
            }

            if (existingCeo) {
              // 既存のCEOを更新
              const { error: ceoUpdateError } = await supabase
                .from('positions')
                .update({
                  person_name: updatedData.person_name,
                  updated_at: timestamp
                })
                .eq('id', existingCeo.id)

              if (ceoUpdateError) {
                console.error('CEO update error:', ceoUpdateError)
                return { success: false, error: ceoUpdateError.message }
              }
            } else {
              // 新しいCEOを作成
              const { error: ceoCreateError } = await supabase
                .from('positions')
                .insert({
                  id: uuidv4(),
                  company_id: id,
                  name: 'CEO',
                  person_name: updatedData.person_name,
                  created_at: timestamp,
                  updated_at: timestamp
                })

              if (ceoCreateError) {
                console.error('CEO create error:', ceoCreateError)
                return { success: false, error: ceoCreateError.message }
              }
            }
          }

          console.log('✅ COMPANY AND CEO UPDATED IN DATABASE:', { companyId: id, ceoName: updatedData.person_name })
          return { success: true }
          // breakは不要（returnで抜ける）

        case 'positions':
          updateQuery = supabase
            .from('positions')
            .update({
              name: updatedData.name,
              person_name: updatedData.person_name,
              member_id: updatedData.member_id,
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
              business_id: updatedData.business_id, // business_id統合完了
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
              member_id: updatedData.member_id || null, // メンバー参照を追加
              needs_migration: updatedData.needs_migration || false, // 移行フラグを追加
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
          // business_id削除: layersテーブルには存在しないカラム
          // if (updatedData.business_id !== undefined) layerUpdateData.business_id = updatedData.business_id
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
   * ノード削除
   */
  static async deleteNode(nodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { table, id } = this.parseNodeId(nodeId)
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      console.log('🗑️ DELETING NODE:', { table, id, nodeId })

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Node deletion error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ NODE DELETED FROM DATABASE:', { table, id })
      return { success: true }
    } catch (error) {
      console.error('Node deletion exception:', error)
      return { success: false, error: 'Failed to delete node' }
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
   * エッジをデータベースに保存（business_id影響分析付き）
   */
  static async saveEdge(companyId: string, sourceNodeId: string, targetNodeId: string, edgeData: any): Promise<{ success: boolean; edgeId?: string; error?: string }> {
    try {
      const edgeId = uuidv4()
      
      // 1. エッジをデータベースに保存
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

      // 2. エッジ作成による影響分析・business_id更新
      const impactResult = await EdgeImpactService.handleEdgeCreation(sourceNodeId, targetNodeId)
      if (!impactResult.success) {
        // エッジ作成の影響処理が失敗した場合、エッジも削除してロールバック
        await supabase.from('edges').delete().eq('id', edgeId)
        console.error('❌ Edge impact analysis failed, rolled back edge creation')
        return { success: false, error: impactResult.error }
      }

      console.log('✅ EDGE SAVED WITH IMPACT ANALYSIS:', { edgeId, sourceNodeId, targetNodeId })
      return { success: true, edgeId }
    } catch (error) {
      console.error('Edge save exception:', error)
      return { success: false, error: 'Failed to save edge' }
    }
  }

  /**
   * エッジをデータベースに簡易保存（プラスボタン作成時用）
   * business_idは既に適切に設定されているためEdgeImpactServiceを呼ばない
   */
  static async saveSimpleEdge(companyId: string, sourceNodeId: string, targetNodeId: string, edgeData: any): Promise<{ success: boolean; edgeId?: string; error?: string }> {
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
        console.error('Simple edge save error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ SIMPLE EDGE SAVED:', { edgeId, sourceNodeId, targetNodeId })
      return { success: true, edgeId }
    } catch (error) {
      console.error('Simple edge save exception:', error)
      return { success: false, error: 'Failed to save simple edge' }
    }
  }

  /**
   * エッジをデータベースから削除（business_id影響分析付き）
   */
  static async deleteEdge(edgeId: string, companyId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 削除前にエッジ情報を取得（影響分析用）
      const { data: edgeData, error: fetchError } = await supabase
        .from('edges')
        .select('source_node_id, target_node_id')
        .eq('id', edgeId)
        .single()

      if (fetchError) {
        console.error('Edge fetch error:', fetchError)
        return { success: false, error: fetchError.message }
      }

      if (!edgeData) {
        console.error('Edge not found:', edgeId)
        return { success: false, error: 'Edge not found' }
      }

      // 2. 影響分析・business_id更新処理
      const impactResult = await EdgeImpactService.handleEdgeDeletion(
        edgeId, 
        edgeData.source_node_id, 
        edgeData.target_node_id,
        companyId
      )
      
      if (!impactResult.success) {
        console.error('❌ Edge deletion impact analysis failed:', impactResult.error)
        return { success: false, error: impactResult.error }
      }

      console.log('✅ EDGE DELETED WITH IMPACT ANALYSIS:', edgeId)
      return { success: true }
    } catch (error) {
      console.error('Edge delete exception:', error)
      return { success: false, error: 'Failed to delete edge' }
    }
  }

  /**
   * エッジを更新（再接続、business_id影響分析付き）
   */
  static async updateEdge(edgeId: string, newSourceId: string, newTargetId: string, companyId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. 更新前の古いエッジ情報を取得
      const { data: oldEdgeData, error: fetchError } = await supabase
        .from('edges')
        .select('source_node_id, target_node_id')
        .eq('id', edgeId)
        .single()

      if (fetchError) {
        console.error('Edge fetch error:', fetchError)
        return { success: false, error: fetchError.message }
      }

      if (!oldEdgeData) {
        console.error('Edge not found:', edgeId)
        return { success: false, error: 'Edge not found' }
      }

      // 2. エッジを更新
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

      // 3. 再接続による影響分析・business_id更新
      const impactResult = await EdgeImpactService.handleEdgeReconnection(
        oldEdgeData.target_node_id,
        newSourceId,
        newTargetId,
        companyId
      )
      
      if (!impactResult.success) {
        console.error('❌ Edge reconnection impact analysis failed:', impactResult.error)
        // ロールバック: エッジを元に戻す
        await supabase
          .from('edges')
          .update({
            source_node_id: oldEdgeData.source_node_id,
            target_node_id: oldEdgeData.target_node_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', edgeId)
        return { success: false, error: impactResult.error }
      }

      console.log('✅ EDGE UPDATED WITH IMPACT ANALYSIS:', { edgeId, newSourceId, newTargetId })
      return { success: true }
    } catch (error) {
      console.error('Edge update exception:', error)
      return { success: false, error: 'Failed to update edge' }
    }
  }





}