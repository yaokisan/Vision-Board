import { Edge } from '@xyflow/react'
import { NodeType } from '@/types/flow'

/**
 * エッジ関係を管理するユーティリティサービス
 */
export class EdgeService {
  /**
   * ノードが親エッジを持っているかチェック
   */
  static hasParentEdge(nodeId: string, edges: Edge[]): boolean {
    return edges.some(edge => edge.target === nodeId)
  }

  /**
   * ノードの親ノードIDを取得
   */
  static getParentNodeId(nodeId: string, edges: Edge[]): string | null {
    const parentEdge = edges.find(edge => edge.target === nodeId)
    return parentEdge?.source || null
  }

  /**
   * ノードの子ノードIDリストを取得
   */
  static getChildNodeIds(nodeId: string, edges: Edge[]): string[] {
    return edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target)
  }

  /**
   * ノードIDからノードタイプを抽出
   */
  static getNodeTypeFromId(nodeId: string): NodeType | null {
    const prefix = nodeId.split('-')[0]
    switch (prefix) {
      case 'company': return NodeType.COMPANY
      case 'position': return NodeType.CXO
      case 'business': return NodeType.BUSINESS
      case 'task': return NodeType.TASK
      case 'executor': return NodeType.EXECUTOR
      case 'layer': return NodeType.BUSINESS_LAYER
      default: return null
    }
  }

  /**
   * ノードIDからエンティティIDを抽出
   */
  static getEntityIdFromNodeId(nodeId: string): string {
    return nodeId.split('-').slice(1).join('-')
  }

  /**
   * エッジが属性継承対象かチェック
   */
  static shouldInheritAttribute(sourceNodeId: string, targetNodeId: string): boolean {
    const sourceType = this.getNodeTypeFromId(sourceNodeId)
    const targetType = this.getNodeTypeFromId(targetNodeId)

    // 事業 → 業務のエッジの場合は属性継承
    if (sourceType === NodeType.BUSINESS && targetType === NodeType.TASK) {
      return true
    }

    // その他の組み合わせは継承しない（今後拡張可能）
    return false
  }

  /**
   * 特定のエッジタイプの関係性を確認
   */
  static getBusinessToTaskEdges(edges: Edge[]): Array<{source: string, target: string}> {
    return edges
      .filter(edge => 
        edge.source.startsWith('business-') && 
        edge.target.startsWith('task-')
      )
      .map(edge => ({
        source: edge.source,
        target: edge.target
      }))
  }

  /**
   * エッジの存在確認
   */
  static edgeExists(sourceId: string, targetId: string, edges: Edge[]): boolean {
    return edges.some(edge => 
      edge.source === sourceId && edge.target === targetId
    )
  }
}