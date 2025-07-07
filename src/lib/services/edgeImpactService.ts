import { supabase } from '@/lib/supabase/client'

/**
 * エッジ操作による影響分析サービス
 * エッジの作成・削除・再接続時にbusiness_idに影響するノードを特定・更新する
 */
export class EdgeImpactService {

  /**
   * エッジ削除時の影響分析と更新
   * @param edgeId 削除するエッジのID
   * @param sourceNodeId ソースノードID
   * @param targetNodeId ターゲットノードID
   * @param companyId 会社ID（business_idリセット用）
   */
  static async handleEdgeDeletion(edgeId: string, sourceNodeId: string, targetNodeId: string, companyId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 EDGE DELETION IMPACT ANALYSIS:', { edgeId, sourceNodeId, targetNodeId })

      // 1. エッジをデータベースから削除
      const { error: edgeDeleteError } = await supabase
        .from('edges')
        .delete()
        .eq('id', edgeId)

      if (edgeDeleteError) {
        console.error('❌ Edge deletion failed:', edgeDeleteError)
        return { success: false, error: edgeDeleteError.message }
      }

      // 2. business_id更新をスキップ（外部キー制約のため）
      // TODO: 将来的にはnull許可またはビジネスロジック改善が必要
      console.log('⚠️ Skipping business_id update due to foreign key constraints')
      console.log('📝 Edge deleted but business_id preserved for target node:', targetNodeId)

      console.log('✅ EDGE DELETION COMPLETED:', { 
        edgeId, 
        targetNodeId,
        note: 'business_id preserved due to constraints'
      })

      return { success: true }
    } catch (error) {
      console.error('Edge deletion exception:', error)
      return { success: false, error: 'Failed to handle edge deletion' }
    }
  }

  /**
   * エッジ作成時の影響分析と更新
   * @param sourceNodeId ソースノードID
   * @param targetNodeId ターゲットノードID
   */
  static async handleEdgeCreation(sourceNodeId: string, targetNodeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 EDGE CREATION IMPACT ANALYSIS:', { sourceNodeId, targetNodeId })

      // 1. ソースノードのbusiness_idを取得
      const sourceBusinessId = await this.getNodeBusinessId(sourceNodeId)
      if (sourceBusinessId.error) {
        return { success: false, error: sourceBusinessId.error }
      }

      // 会社ノード（business_id = null）からの接続の場合は継承処理をスキップ
      if (sourceBusinessId.businessId === null) {
        console.log('⚠️ Skipping business_id inheritance from company node (null business_id):', sourceNodeId)
        return { success: true }
      }

      // 2. ターゲットノードのbusiness_idを更新
      const targetResult = await this.updateNodeBusinessId(targetNodeId, sourceBusinessId.businessId)
      if (!targetResult.success) {
        console.error('❌ Target node business_id update failed:', targetResult.error)
        return { success: false, error: targetResult.error }
      }

      // 3. ターゲットノードの子孫ノードのbusiness_idも更新
      const descendantsResult = await this.updateDescendantBusinessIds(targetNodeId, sourceBusinessId.businessId)
      if (!descendantsResult.success) {
        console.error('❌ Descendant nodes business_id update failed:', descendantsResult.error)
        return { success: false, error: descendantsResult.error }
      }

      console.log('✅ EDGE CREATION COMPLETED:', { 
        sourceNodeId, 
        targetNodeId,
        businessId: sourceBusinessId.businessId,
        updatedDescendants: descendantsResult.affectedNodes 
      })

      return { success: true }
    } catch (error) {
      console.error('Edge creation exception:', error)
      return { success: false, error: 'Failed to handle edge creation' }
    }
  }

  /**
   * エッジ再接続時の影響分析と更新
   * @param oldTargetNodeId 古いターゲットノードID
   * @param newSourceNodeId 新しいソースノードID
   * @param newTargetNodeId 新しいターゲットノードID
   * @param companyId 会社ID（business_idリセット用）
   */
  static async handleEdgeReconnection(
    oldTargetNodeId: string, 
    newSourceNodeId: string, 
    newTargetNodeId: string,
    companyId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 EDGE RECONNECTION IMPACT ANALYSIS:', { 
        oldTargetNodeId, 
        newSourceNodeId, 
        newTargetNodeId 
      })

      // 1. 古いターゲットのbusiness_id更新をスキップ（外部キー制約のため）
      console.log('⚠️ Skipping old target business_id reset due to constraints:', oldTargetNodeId)

      // 2. 新しいソースノードのbusiness_idを取得
      const newSourceBusinessId = await this.getNodeBusinessId(newSourceNodeId)
      if (newSourceBusinessId.error) {
        return { success: false, error: newSourceBusinessId.error }
      }

      // 3. 新しいターゲットノードのbusiness_idを更新
      const newTargetResult = await this.updateNodeBusinessId(newTargetNodeId, newSourceBusinessId.businessId)
      if (!newTargetResult.success) {
        return { success: false, error: newTargetResult.error }
      }

      // 4. 新しいターゲットノードの子孫も更新
      const newDescendantsResult = await this.updateDescendantBusinessIds(newTargetNodeId, newSourceBusinessId.businessId)
      if (!newDescendantsResult.success) {
        return { success: false, error: newDescendantsResult.error }
      }

      console.log('✅ EDGE RECONNECTION COMPLETED:', { 
        oldTarget: { nodeId: oldTargetNodeId, note: 'business_id preserved' },
        newTarget: { nodeId: newTargetNodeId, businessId: newSourceBusinessId.businessId, updatedDescendants: newDescendantsResult.affectedNodes }
      })

      return { success: true }
    } catch (error) {
      console.error('Edge reconnection exception:', error)
      return { success: false, error: 'Failed to handle edge reconnection' }
    }
  }

  /**
   * ノードのbusiness_idを取得
   */
  private static async getNodeBusinessId(nodeId: string): Promise<{ businessId: string | null; error?: string }> {
    try {
      const { table, id } = this.parseNodeId(nodeId)
      if (!table || !id) {
        return { businessId: null, error: 'Invalid node ID format' }
      }

      // 事業ノードの場合は自分自身のIDを返す
      if (table === 'businesses') {
        return { businessId: id }
      }

      // business_idカラムが存在しないテーブルの場合はnullを返す
      if (table === 'companies' || table === 'positions' || table === 'layers') {
        console.log('⚠️ Table without business_id column, returning null:', table, nodeId)
        return { businessId: null }
      }

      // business_idカラムがあるテーブル（tasks, executors）の場合のみ取得
      const { data, error } = await supabase
        .from(table)
        .select('business_id')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Get node business_id error:', error)
        return { businessId: null, error: error.message }
      }

      return { businessId: data.business_id }
    } catch (error) {
      console.error('Get node business_id exception:', error)
      return { businessId: null, error: 'Failed to get node business_id' }
    }
  }

  /**
   * ノードのbusiness_idを更新
   */
  private static async updateNodeBusinessId(nodeId: string, businessId: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const { table, id } = this.parseNodeId(nodeId)
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      // 事業ノードの場合はbusiness_idを変更しない（自分自身のID）
      if (table === 'businesses') {
        console.log('🔄 Business node business_id not updated (uses own ID):', nodeId)
        return { success: true }
      }

      // business_idカラムが存在しないテーブルの場合はスキップ
      if (table === 'companies' || table === 'positions' || table === 'layers') {
        console.log('⚠️ Skipping business_id update for table without business_id column:', table, nodeId)
        return { success: true }
      }

      const { error } = await supabase
        .from(table)
        .update({
          business_id: businessId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Update node business_id error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ NODE BUSINESS_ID UPDATED:', { nodeId, businessId })
      return { success: true }
    } catch (error) {
      console.error('Update node business_id exception:', error)
      return { success: false, error: 'Failed to update node business_id' }
    }
  }

  /**
   * ノードのbusiness_idをnullにリセット（会社直属に）
   */
  private static async resetNodeBusinessId(nodeId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateNodeBusinessId(nodeId, null)
  }

  /**
   * 子孫ノードのbusiness_idを再帰的に更新
   */
  private static async updateDescendantBusinessIds(parentNodeId: string, businessId: string | null): Promise<{ success: boolean; affectedNodes?: string[]; error?: string }> {
    try {
      const affectedNodes: string[] = []

      // 子ノードを取得して再帰的に更新
      const children = await this.getChildNodes(parentNodeId)
      
      for (const childNodeId of children) {
        // 子ノード自体を更新
        const updateResult = await this.updateNodeBusinessId(childNodeId, businessId)
        if (!updateResult.success) {
          return { success: false, error: updateResult.error }
        }
        affectedNodes.push(childNodeId)

        // 孫ノード以下も再帰的に更新
        const descendantResult = await this.updateDescendantBusinessIds(childNodeId, businessId)
        if (!descendantResult.success) {
          return { success: false, error: descendantResult.error }
        }
        if (descendantResult.affectedNodes) {
          affectedNodes.push(...descendantResult.affectedNodes)
        }
      }

      return { success: true, affectedNodes }
    } catch (error) {
      console.error('Update descendant business_ids exception:', error)
      return { success: false, error: 'Failed to update descendant business_ids' }
    }
  }

  /**
   * 子孫ノードのbusiness_idを再帰的にリセット
   */
  private static async resetDescendantBusinessIds(parentNodeId: string): Promise<{ success: boolean; affectedNodes?: string[]; error?: string }> {
    return this.updateDescendantBusinessIds(parentNodeId, null)
  }

  /**
   * 指定ノードの直接の子ノードIDリストを取得
   */
  private static async getChildNodes(parentNodeId: string): Promise<string[]> {
    try {
      // エッジテーブルから子ノードを検索
      const { data: edges, error } = await supabase
        .from('edges')
        .select('target_node_id')
        .eq('source_node_id', parentNodeId)

      if (error) {
        console.error('Get child nodes error:', error)
        return []
      }

      return edges.map(edge => edge.target_node_id)
    } catch (error) {
      console.error('Get child nodes exception:', error)
      return []
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
}