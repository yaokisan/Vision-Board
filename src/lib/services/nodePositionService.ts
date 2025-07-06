/**
 * ノード位置保存サービス
 * React Flow上でのノード位置をSupabaseに永続化
 */

import { supabase } from '@/lib/supabase/client'

export interface NodePosition {
  x: number
  y: number
}

export interface NodeSize {
  width: number
  height: number
}

export class NodePositionService {
  /**
   * ノード位置を保存
   */
  static async saveNodePosition(nodeId: string, position: NodePosition): Promise<{ success: boolean; error?: string }> {
    try {
      // 一時的なノード（Date.nowで生成されたID）をスキップ
      if (this.isTemporaryNode(nodeId)) {
        console.log('Skipping position save for temporary node:', nodeId)
        return { success: true } // エラーではないのでtrueを返す
      }

      // ノードIDからテーブルとIDを判定
      const { table, id } = this.parseNodeId(nodeId)
      
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      // UUIDの形式をチェック
      if (!this.isValidUUID(id)) {
        console.log('Skipping position save for non-UUID ID:', nodeId)
        return { success: true } // エラーではないのでtrueを返す
      }

      // 対応するテーブルの位置情報を更新
      const { error } = await supabase
        .from(table)
        .update({
          position_x: position.x,
          position_y: position.y,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Position save error:', error)
        return { success: false, error: error.message }
      }

      console.log(`Position saved for ${table}:${id}`, position)
      return { success: true }
    } catch (error) {
      console.error('Position save exception:', error)
      return { success: false, error: 'Failed to save position' }
    }
  }

  /**
   * レイヤーノードのサイズを保存
   */
  static async saveLayerSize(nodeId: string, size: NodeSize): Promise<{ success: boolean; error?: string }> {
    try {
      // 一時的なノード（Date.nowで生成されたID）をスキップ
      if (this.isTemporaryNode(nodeId)) {
        console.log('Skipping size save for temporary node:', nodeId)
        return { success: true } // エラーではないのでtrueを返す
      }

      // ノードIDからテーブルとIDを判定
      const { table, id } = this.parseNodeId(nodeId)
      
      if (!table || !id) {
        return { success: false, error: 'Invalid node ID format' }
      }

      // layersテーブルのみサイズ保存をサポート
      if (table !== 'layers') {
        console.log('Size save only supported for layers:', nodeId)
        return { success: true } // エラーではないのでtrueを返す
      }

      // UUIDの形式をチェック
      if (!this.isValidUUID(id)) {
        console.log('Skipping size save for non-UUID ID:', nodeId)
        return { success: true } // エラーではないのでtrueを返す
      }

      // layersテーブルのサイズ情報を更新
      const { error } = await supabase
        .from('layers')
        .update({
          width: size.width,
          height: size.height,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Size save error:', error)
        return { success: false, error: error.message }
      }

      console.log(`Size saved for ${table}:${id}`, size)
      return { success: true }
    } catch (error) {
      console.error('Size save exception:', error)
      return { success: false, error: 'Failed to save size' }
    }
  }

  /**
   * 複数ノードの位置を一括保存
   */
  static async saveMultipleNodePositions(nodePositions: Record<string, NodePosition>): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = []
    
    for (const [nodeId, position] of Object.entries(nodePositions)) {
      const result = await this.saveNodePosition(nodeId, position)
      if (!result.success && result.error) {
        errors.push(`${nodeId}: ${result.error}`)
      }
    }

    return {
      success: errors.length === 0,
      errors
    }
  }

  /**
   * ノードIDをパースしてテーブル名とIDを取得
   * 
   * ノードIDの形式:
   * - company-{uuid}: companiesテーブル
   * - position-{uuid}: positionsテーブル  
   * - layer-{uuid}: layersテーブル
   * - business-{uuid}: businessesテーブル
   * - task-{uuid}: tasksテーブル
   * - executor-{uuid}: executorsテーブル
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
   * 一時的なノード（Date.nowで生成）かどうかを判定
   */
  private static isTemporaryNode(nodeId: string): boolean {
    // Date.nowで生成されたIDは数値のみ（13桁程度）
    const parts = nodeId.split('-')
    if (parts.length < 2) return false
    
    const id = parts.slice(1).join('-')
    return /^\d{10,}$/.test(id) // 10桁以上の数値のみの場合は一時的
  }

  /**
   * 有効なUUID形式かどうかをチェック
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * デバッグ用：ノードIDの解析結果を表示
   */
  static debugNodeId(nodeId: string): void {
    const { table, id } = this.parseNodeId(nodeId)
    const isTemp = this.isTemporaryNode(nodeId)
    const isUUID = this.isValidUUID(id || '')
    console.log(`NodeID: ${nodeId} -> Table: ${table}, ID: ${id}, Temporary: ${isTemp}, ValidUUID: ${isUUID}`)
  }
}