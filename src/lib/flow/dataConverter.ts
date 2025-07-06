// 既存データからReact Flow形式への変換ユーティリティ
import { Company, Position, Layer, Business, Task, Executor } from '@/types'
import { Edge } from '@xyflow/react'
import { FlowNode, NodeType, EdgeType, OrganizationFlowData } from '@/types/flow'
import { supabase } from '@/lib/supabase/client'

export class FlowDataConverter {
  // コンテナ表示判定メソッド
  static shouldShowContainer(
    container: { displayTab?: string },
    currentTab: 'company' | string
  ): boolean {
    // 会社タブでは全てのコンテナを表示
    if (currentTab === 'company') {
      return true
    }
    
    // 事業タブでは、該当事業設定のコンテナのみ表示
    const containerDisplayTab = container.displayTab || 'company'
    return containerDisplayTab === currentTab
  }
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
      
      // デバッグ: 会社の位置情報をログ出力
      console.log('🏢 COMPANY POSITION DATA:', {
        id: company.id,
        name: company.name,
        position_x: (company as any).position_x,
        position_y: (company as any).position_y,
        company
      })
      
      const savedX = (company as any).position_x
      const savedY = (company as any).position_y
      const defaultPosition = { x: 500, y: 50 }
      
      // 文字列の"0"も有効な位置として扱う
      const hasValidPosition = (savedX !== null && savedX !== undefined && savedY !== null && savedY !== undefined)
      const finalPosition = hasValidPosition
        ? { x: Number(savedX), y: Number(savedY) }
        : defaultPosition
      
      console.log('🏢 FINAL POSITION:', company.name, finalPosition)
      
      nodes.push({
        id: `company-${company.id}`,
        type: NodeType.COMPANY,
        position: finalPosition,
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
          entity: { id: 'cxo-layer', name: 'CXOレイヤー' },
          label: 'CXOレイヤー',
          containerSize: { width: 800, height: 200 },
          displayTab: 'company' // デフォルトは company タブで表示
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
          position: { 
            x: (position as any).position_x !== null && (position as any).position_x !== undefined 
              ? Number((position as any).position_x) 
              : (50 + index * 280), 
            y: (position as any).position_y !== null && (position as any).position_y !== undefined 
              ? Number((position as any).position_y) 
              : 50 
          },
          data: {
            entity: position,
            label: `${position.name}: ${position.person_name}`,
            size: { width: 224, height: 120 }
          },
          parentNode: 'cxo-layer',
          extent: 'parent' as const,
          draggable: true,
          selectable: true
        })
      }
    })
    
    // 事業・経営レイヤーコンテナ
    layers.forEach((layer, index) => {
      // デバッグ: レイヤーの位置情報をログ出力
      console.log('📋 LAYER POSITION DATA:', {
        id: layer.id,
        name: layer.name,
        position_x: (layer as any).position_x,
        position_y: (layer as any).position_y,
        layer
      })
      
      const savedX = (layer as any).position_x
      const savedY = (layer as any).position_y
      const defaultPosition = { x: 100 + index * 600, y: 500 }
      
      // 文字列の"0"も有効な位置として扱う
      const hasValidPosition = (savedX !== null && savedX !== undefined && savedY !== null && savedY !== undefined)
      const finalPosition = hasValidPosition
        ? { x: Number(savedX), y: Number(savedY) }
        : defaultPosition
      
      console.log('📋 FINAL LAYER POSITION:', layer.name, finalPosition)
      
      nodes.push({
        id: `layer-${layer.id}`,
        type: NodeType.BUSINESS_LAYER,
        position: finalPosition,
        data: {
          entity: layer,
          label: `${layer.name}レイヤー`,
          type: layer.type as 'business' | 'management',
          containerSize: { width: 500, height: 600 },
          displayTab: layer.displayTab || 'company' // レイヤーのdisplayTabを使用
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
          x: business.position_x !== null && business.position_x !== undefined 
            ? Number(business.position_x) 
            : 50 + (index % 2) * 280, 
          y: business.position_y !== null && business.position_y !== undefined 
            ? Number(business.position_y) 
            : 50 + Math.floor(index / 2) * 200
        },
        data: {
          entity: business,
          label: business.name,
          size: { width: 256, height: 160 }
        },
        parentNode: `layer-${business.layer_id}`,
        extent: 'parent' as const,
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
          x: task.position_x !== null && task.position_x !== undefined 
            ? Number(task.position_x) 
            : 50 + (index % 2) * 240, 
          y: task.position_y !== null && task.position_y !== undefined 
            ? Number(task.position_y) 
            : 250 + Math.floor(index / 2) * 120
        },
        data: {
          entity: task,
          label: task.name,
          size: { width: 224, height: 100 }
        },
        parentNode: !task.business_id ? `layer-${task.layer_id}` : undefined,
        extent: !task.business_id ? 'parent' as const : undefined,
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
          x: executor.position_x !== null && executor.position_x !== undefined 
            ? Number(executor.position_x) 
            : 50 + (index % 3) * 200, 
          y: executor.position_y !== null && executor.position_y !== undefined 
            ? Number(executor.position_y) 
            : 400 + Math.floor(index / 3) * 100
        },
        data: {
          entity: executor,
          label: executor.name,
          size: { width: 192, height: 80 }
        },
        parentNode: layerId ? `layer-${layerId}` : undefined,
        extent: layerId ? 'parent' as const : undefined,
        draggable: true,
        selectable: true
      })
    })
    
    return nodes
  }
  
  // エッジ変換（データベースから読み込み + 固定エッジ）
  static async convertToEdges(
    companies: Company[],
    positions: Position[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[],
    companyId: string
  ): Promise<Edge[]> {
    const edges: Edge[] = []
    
    try {
      // データベースから保存されたエッジを読み込み
      const { data: savedEdges, error } = await supabase
        .from('edges')
        .select('*')
        .eq('company_id', companyId)

      if (error) {
        console.error('Failed to load edges from database:', error)
      } else if (savedEdges) {
        // 保存されたエッジをReact Flow形式に変換
        savedEdges.forEach(edge => {
          edges.push({
            id: edge.id,
            source: edge.source_node_id,
            target: edge.target_node_id,
            type: edge.edge_type || 'default',
            style: edge.style || { 
              stroke: '#4c6ef5', 
              strokeWidth: 2,
              strokeDasharray: '2,4'
            },
            animated: edge.animated !== undefined ? edge.animated : true,
            reconnectable: edge.reconnectable !== undefined ? edge.reconnectable : true,
            deletable: edge.deletable !== undefined ? edge.deletable : true
          })
        })
        console.log('📊 LOADED EDGES FROM DATABASE:', savedEdges.length)
      }
    } catch (error) {
      console.error('Edge loading exception:', error)
    }

    // 固定エッジ（後方互換性のため保持）
    // 会社 → 役職（CXO）
    positions.forEach(position => {
      if (position.name !== 'CEO') { // CEOは会社カードに統合済み
        const edgeId = `company-position-${position.id}`
        // 既に保存されたエッジが存在しない場合のみ追加
        if (!edges.find(edge => edge.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: `company-${position.company_id}`,
            target: `position-${position.id}`,
            type: 'default',
            style: { 
              stroke: '#4c6ef5', 
              strokeWidth: 2,
              strokeDasharray: '2,4'
            },
            animated: true,
            reconnectable: true,
            deletable: true
          })
        }
      }
    })
    
    // 役職 → 事業（CTOから事業への管理線）
    const ctoPosition = positions.find(p => p.name.includes('CTO'))
    if (ctoPosition) {
      businesses.forEach(business => {
        const edgeId = `position-business-${business.id}`
        if (!edges.find(edge => edge.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: `position-${ctoPosition.id}`,
            target: `business-${business.id}`,
            type: 'default',
            style: { 
              stroke: '#4c6ef5', 
              strokeWidth: 2,
              strokeDasharray: '2,4'
            },
            animated: true,
            reconnectable: true,
            deletable: true
          })
        }
      })
    }
    
    // 事業 → 業務
    tasks.forEach(task => {
      if (task.business_id) {
        const edgeId = `business-task-${task.id}`
        if (!edges.find(edge => edge.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: `business-${task.business_id}`,
            target: `task-${task.id}`,
            type: 'default',
            style: { 
              stroke: '#4c6ef5', 
              strokeWidth: 2,
              strokeDasharray: '2,4'
            },
            animated: true,
            reconnectable: true,
            deletable: true
          })
        }
      }
    })
    
    // 業務 → 実行者
    executors.forEach(executor => {
      const edgeId = `task-executor-${executor.id}`
      if (!edges.find(edge => edge.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: `task-${executor.task_id}`,
          target: `executor-${executor.id}`,
          type: 'default',
          style: { 
            stroke: '#4c6ef5', 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true,
          reconnectable: true
        })
      }
    })
    
    return edges
  }
  
  // 統合変換メソッド
  static async convertToFlowData(
    companies: Company[],
    positions: Position[],
    layers: Layer[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[],
    companyId: string,
    viewMode: 'company' | 'business' = 'company',
    selectedBusinessId?: string | null
  ): Promise<OrganizationFlowData> {
    let nodes = this.convertToNodes(companies, positions, layers, businesses, tasks, executors)
    let edges = await this.convertToEdges(companies, positions, businesses, tasks, executors, companyId)
    
    // 事業ビューの場合、会社とCXO関連ノードを除外
    if (viewMode === 'business') {
      nodes = nodes.filter(node => 
        node.type !== 'company' && 
        node.type !== 'cxo' && 
        node.type !== 'cxo_layer'
      )
      
      // 特定の事業が選択されている場合、その事業関連のノードのみ表示
      if (selectedBusinessId) {
        // 選択された事業のタスクIDを取得
        const selectedBusinessTasks = tasks.filter(task => task.business_id === selectedBusinessId)
        const selectedBusinessTaskIds = selectedBusinessTasks.map(task => task.id)
        
        // 選択された事業のエクゼキューターIDを取得
        const selectedBusinessExecutors = executors.filter(executor => 
          selectedBusinessTaskIds.includes(executor.task_id)
        )
        const selectedBusinessExecutorIds = selectedBusinessExecutors.map(executor => executor.id)
        
        // 選択された事業に関連するノードのみをフィルタリング
        nodes = nodes.filter(node => {
          // 事業レイヤーは常に表示
          if (node.type === 'business_layer') return true
          
          // 選択された事業のノード
          if (node.id === `business-${selectedBusinessId}`) return true
          
          // 選択された事業のタスクノード
          if (node.type === 'task' && selectedBusinessTaskIds.includes(node.data.entity.id)) return true
          
          // 選択された事業のエクゼキューターノード
          if (node.type === 'executor' && selectedBusinessExecutorIds.includes(node.data.entity.id)) return true
          
          return false
        })
      }
      
      // 会社・CXO関連のエッジも除外
      edges = edges.filter(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        return sourceNode && targetNode
      })
    }
    
    return { nodes, edges }
  }

  // コンテナフィルタリング付きの変換メソッド
  static async convertToFlowDataWithContainerFilter(
    companies: Company[],
    positions: Position[],
    layers: Layer[],
    businesses: Business[],
    tasks: Task[],
    executors: Executor[],
    companyId: string,
    viewMode: 'company' | 'business' = 'company',
    selectedBusinessId?: string | null
  ): Promise<OrganizationFlowData> {
    let nodes = this.convertToNodes(companies, positions, layers, businesses, tasks, executors)
    let edges = await this.convertToEdges(companies, positions, businesses, tasks, executors, companyId)
    
    // 事業ビューの場合、会社とCXO関連ノードを除外
    if (viewMode === 'business') {
      nodes = nodes.filter(node => 
        node.type !== 'company' && 
        node.type !== 'cxo' && 
        node.type !== 'cxo_layer'
      )
      
      // 特定の事業が選択されている場合、その事業関連のノードのみ表示
      if (selectedBusinessId) {
        // 選択された事業のタスクIDを取得
        const selectedBusinessTasks = tasks.filter(task => task.business_id === selectedBusinessId)
        const selectedBusinessTaskIds = selectedBusinessTasks.map(task => task.id)
        
        // 選択された事業のエクゼキューターIDを取得
        const selectedBusinessExecutors = executors.filter(executor => 
          selectedBusinessTaskIds.includes(executor.task_id)
        )
        const selectedBusinessExecutorIds = selectedBusinessExecutors.map(executor => executor.id)
        
        // 選択された事業に関連するノードのみをフィルタリング
        nodes = nodes.filter(node => {
          // 事業レイヤーはdisplayTabに基づいてフィルタリング
          if (node.type === 'business_layer') {
            const displayTab = node.data.displayTab || 'company'
            return this.shouldShowContainer({ displayTab }, selectedBusinessId)
          }
          
          // 選択された事業のノード
          if (node.id === `business-${selectedBusinessId}`) return true
          
          // 選択された事業のタスクノード
          if (node.type === 'task' && selectedBusinessTaskIds.includes(node.data.entity.id)) return true
          
          // 選択された事業のエクゼキューターノード
          if (node.type === 'executor' && selectedBusinessExecutorIds.includes(node.data.entity.id)) return true
          
          return false
        })
      }
      
      // 会社・CXO関連のエッジも除外
      edges = edges.filter(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source)
        const targetNode = nodes.find(n => n.id === edge.target)
        return sourceNode && targetNode
      })
    } else {
      // 会社ビューの場合はコンテナフィルタリングのみ適用
      // displayTabが設定されていないレイヤーは会社タブで表示
      // （既存の動作を維持）
    }
    
    return { nodes, edges }
  }
}