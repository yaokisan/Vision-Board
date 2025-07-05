// 既存データからReact Flow形式への変換ユーティリティ
import { Company, Position, Layer, Business, Task, Executor } from '@/types'
import { FlowNode, FlowEdge, NodeType, EdgeType, OrganizationFlowData } from '@/types/flow'

export class FlowDataConverter {
  // ノード変換
  static convertToNodes(
    companies: Company[],
    positions: Position[],
    layers: Layer[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[]
  ): FlowNode[] {
    const nodes: FlowNode[] = []
    
    // 会社ノード
    companies.forEach(company => {
      const ceo = positions.find(p => p.company_id === company.id && p.name === 'CEO')
      
      nodes.push({
        id: `company-${company.id}`,
        type: NodeType.COMPANY,
        position: { x: 500, y: 50 }, // 中央上部
        data: {
          entity: company,
          label: company.name,
          size: { width: 320, height: 120 },
          ceoName: ceo?.person_name
        },
        draggable: true,
        selectable: true
      })
    })
    
    // CXOレイヤーコンテナ
    if (positions.some(p => p.name !== 'CEO')) {
      nodes.push({
        id: 'cxo-layer',
        type: NodeType.CXO_LAYER,
        position: { x: 200, y: 250 },
        data: {
          entity: { id: 'cxo-layer', type: 'cxo' },
          label: 'CXOレイヤー',
          containerSize: { width: 800, height: 200 }
        },
        draggable: true,
        selectable: true
      })
    }
    
    // 役職ノード（CXO）- CXOレイヤー内に配置
    positions.forEach((position, index) => {
      if (position.name !== 'CEO') { // CEOは会社カードに統合
        nodes.push({
          id: `position-${position.id}`,
          type: NodeType.CXO,
          position: { x: 50 + index * 280, y: 50 },
          data: {
            entity: position,
            label: `${position.name}: ${position.person_name}`,
            size: { width: 224, height: 120 }
          },
          parentNode: 'cxo-layer',
          extent: 'parent',
          draggable: true,
          selectable: true
        })
      }
    })
    
    // 事業・経営レイヤーコンテナ
    layers.forEach((layer, index) => {
      nodes.push({
        id: `layer-${layer.id}`,
        type: NodeType.BUSINESS_LAYER,
        position: { x: 100 + index * 600, y: 500 },
        data: {
          entity: layer,
          label: `${layer.name}レイヤー`,
          type: layer.type,
          containerSize: { width: 500, height: 600 }
        },
        draggable: true,
        selectable: true
      })
    })
    
    // 事業ノード - レイヤー内に配置
    businesses.forEach((business, index) => {
      nodes.push({
        id: `business-${business.id}`,
        type: NodeType.BUSINESS,
        position: { 
          x: business.position_x || 50 + (index % 2) * 280, 
          y: business.position_y || 50 + Math.floor(index / 2) * 200
        },
        data: {
          entity: business,
          label: business.name,
          size: { width: 256, height: 160 }
        },
        parentNode: `layer-${business.layer_id}`,
        extent: 'parent',
        draggable: true,
        selectable: true
      })
    })
    
    // 業務ノード - 事業ノードまたはレイヤー内に配置
    tasks.forEach((task, index) => {
      const parentId = task.business_id ? `business-${task.business_id}` : `layer-${task.layer_id}`
      
      nodes.push({
        id: `task-${task.id}`,
        type: NodeType.TASK,
        position: { 
          x: task.position_x || 50 + (index % 2) * 240, 
          y: task.position_y || 250 + Math.floor(index / 2) * 120
        },
        data: {
          entity: task,
          label: task.name,
          size: { width: 224, height: 100 }
        },
        parentNode: !task.business_id ? `layer-${task.layer_id}` : undefined,
        extent: !task.business_id ? 'parent' : undefined,
        draggable: true,
        selectable: true
      })
    })
    
    // 実行者ノード - レイヤー内に配置
    executors.forEach((executor, index) => {
      const task = tasks.find(t => t.id === executor.task_id)
      const layerId = task?.layer_id
      
      nodes.push({
        id: `executor-${executor.id}`,
        type: NodeType.EXECUTOR,
        position: { 
          x: executor.position_x || 50 + (index % 3) * 200, 
          y: executor.position_y || 400 + Math.floor(index / 3) * 100
        },
        data: {
          entity: executor,
          label: executor.name,
          size: { width: 192, height: 80 }
        },
        parentNode: layerId ? `layer-${layerId}` : undefined,
        extent: layerId ? 'parent' : undefined,
        draggable: true,
        selectable: true
      })
    })
    
    return nodes
  }
  
  // エッジ変換
  static convertToEdges(
    companies: Company[],
    positions: Position[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[]
  ): FlowEdge[] {
    const edges: FlowEdge[] = []
    
    // 会社 → 役職（CXO）
    positions.forEach(position => {
      if (position.name !== 'CEO') { // CEOは会社カードに統合済み
        edges.push({
          id: `company-position-${position.id}`,
          source: `company-${position.company_id}`,
          target: `position-${position.id}`,
          type: EdgeType.HIERARCHY,
          data: { color: '#4c6ef5', animated: true },
          style: { 
            stroke: '#4c6ef5', 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true
        })
      }
    })
    
    // 役職 → 事業（CTOから事業への管理線）
    const ctoPosition = positions.find(p => p.name === 'CTO')
    if (ctoPosition) {
      businesses.forEach(business => {
        edges.push({
          id: `position-business-${business.id}`,
          source: `position-${ctoPosition.id}`,
          target: `business-${business.id}`,
          type: EdgeType.MANAGEMENT,
          data: { color: '#10b981', animated: true },
          style: { 
            stroke: '#10b981', 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true
        })
      })
    }
    
    // 事業 → 業務
    tasks.forEach(task => {
      if (task.business_id) {
        edges.push({
          id: `business-task-${task.id}`,
          source: `business-${task.business_id}`,
          target: `task-${task.id}`,
          type: EdgeType.HIERARCHY,
          data: { color: '#f59e0b', animated: true },
          style: { 
            stroke: '#f59e0b', 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true
        })
      }
    })
    
    // 業務 → 実行者
    executors.forEach(executor => {
      edges.push({
        id: `task-executor-${executor.id}`,
        source: `task-${executor.task_id}`,
        target: `executor-${executor.id}`,
        type: EdgeType.EXECUTION,
        data: { color: '#ef4444', animated: true },
        style: { 
          stroke: '#ef4444', 
          strokeWidth: 1,
          strokeDasharray: '4,2'
        },
        animated: true
      })
    })
    
    return edges
  }
  
  // 統合変換メソッド
  static convertToFlowData(
    companies: Company[],
    positions: Position[],
    layers: Layer[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[]
  ): OrganizationFlowData {
    const nodes = this.convertToNodes(companies, positions, layers, businesses, tasks, executors)
    const edges = this.convertToEdges(companies, positions, businesses, tasks, executors)
    
    return { nodes, edges }
  }
}