/**
 * エッジ接続の制約チェックサービス
 * 視覚的エッジの存在確認、循環参照検出、接続パターン検証を行う
 */

import { Edge } from '@xyflow/react'

export enum NodeType {
  COMPANY = 'company',
  CXO = 'position', 
  BUSINESS = 'business',
  TASK = 'task',
  EXECUTOR = 'executor'
}

interface ValidationResult {
  isValid: boolean
  reason?: string
}

export class EdgeConnectionValidator {
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
      default: return null
    }
  }

  /**
   * 接続パターンが許可されているかチェック
   */
  static isValidConnectionPattern(sourceId: string, targetId: string): ValidationResult {
    const sourceType = this.getNodeTypeFromId(sourceId)
    const targetType = this.getNodeTypeFromId(targetId)

    if (!sourceType || !targetType) {
      return { isValid: false, reason: 'Unknown node type' }
    }

    // 許可されたパターン
    const validPatterns = [
      [NodeType.BUSINESS, NodeType.TASK],    // business → task
      [NodeType.TASK, NodeType.EXECUTOR],    // task → executor
      [NodeType.TASK, NodeType.TASK]         // task → task
    ]

    const isValidPattern = validPatterns.some(([source, target]) => 
      sourceType === source && targetType === target
    )

    if (!isValidPattern) {
      return { 
        isValid: false, 
        reason: `Connection from ${sourceType} to ${targetType} is not allowed` 
      }
    }

    return { isValid: true }
  }

  /**
   * 視覚的エッジが既に存在するかチェック
   */
  static hasExistingVisualEdge(targetId: string, edges: Edge[]): ValidationResult {
    const existingEdge = edges.find(edge => edge.target === targetId)
    
    if (existingEdge) {
      return { 
        isValid: false, 
        reason: `Target node ${targetId} already has an incoming edge from ${existingEdge.source}` 
      }
    }

    return { isValid: true }
  }

  /**
   * 循環参照をチェック（task → task の場合）
   */
  static checkCircularReference(sourceId: string, targetId: string, edges: Edge[]): ValidationResult {
    // task → task 以外は循環参照チェック不要
    const sourceType = this.getNodeTypeFromId(sourceId)
    const targetType = this.getNodeTypeFromId(targetId)
    
    if (sourceType !== NodeType.TASK || targetType !== NodeType.TASK) {
      return { isValid: true }
    }

    // 循環参照検出のためのグラフ探索
    const visited = new Set<string>()
    const path = new Set<string>()

    const hasCycle = (nodeId: string): boolean => {
      if (path.has(nodeId)) {
        return true // 循環参照発見
      }
      
      if (visited.has(nodeId)) {
        return false // 既に探索済み
      }

      visited.add(nodeId)
      path.add(nodeId)

      // 現在のノードから出ているエッジを探索
      const outgoingEdges = edges.filter(edge => edge.source === nodeId)
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) {
          return true
        }
      }

      path.delete(nodeId)
      return false
    }

    // 新しいエッジを仮想的に追加して循環参照をチェック
    const tempEdges = [...edges, { id: 'temp', source: sourceId, target: targetId }]
    
    // ターゲットノードから始めて循環参照をチェック
    const edgesFromTarget = tempEdges.filter(edge => edge.source === targetId)
    for (const edge of edgesFromTarget) {
      visited.clear()
      path.clear()
      
      if (hasCycle(edge.target)) {
        return { 
          isValid: false, 
          reason: `Connection would create circular reference: ${sourceId} → ${targetId}` 
        }
      }
    }

    return { isValid: true }
  }

  /**
   * 全ての制約チェックを実行
   */
  static validateConnection(sourceId: string, targetId: string, edges: Edge[]): ValidationResult {
    // 1. 接続パターンチェック
    const patternResult = this.isValidConnectionPattern(sourceId, targetId)
    if (!patternResult.isValid) {
      return patternResult
    }

    // 2. 既存の視覚的エッジチェック
    const visualEdgeResult = this.hasExistingVisualEdge(targetId, edges)
    if (!visualEdgeResult.isValid) {
      return visualEdgeResult
    }

    // 3. 循環参照チェック
    const circularResult = this.checkCircularReference(sourceId, targetId, edges)
    if (!circularResult.isValid) {
      return circularResult
    }

    return { isValid: true }
  }
}