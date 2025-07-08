// 既存データからReact Flow形式への変換ユーティリティ
import { Company, Position, Layer, Business, Task, Executor } from '@/types'
import { Edge } from '@xyflow/react'
import { FlowNode, NodeType, EdgeType, OrganizationFlowData } from '@/types/flow'
import { supabase } from '@/lib/supabase/client'

export class FlowDataConverter {
  // コンテナ表示判定メソッド（business_id統合版）
  static shouldShowContainer(
    container: { business_id?: string | null; attribute?: string },
    currentTab: 'company' | string
  ): boolean {
    // 会社タブでは全てのコンテナを表示
    if (currentTab === 'company') {
      return true
    }
    
    // business_id統合完了: business_idのみ使用
    const containerBusinessId = container.business_id
    
    // business_idがnullまたは'company'の場合は会社レベル
    if (!containerBusinessId || containerBusinessId === 'company') {
      return currentTab === 'company'
    }
    
    // 事業タブでは、該当事業IDのコンテナのみ表示
    return containerBusinessId === currentTab
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
          ceoName: ceo?.person_name,
          business_id: null // 会社ノードはbusiness_id=null
        },
        draggable: true,
        selectable: true
      })
    })
    
    // CXOレイヤーコンテナ - 自動生成を無効化（ダミーデータ問題回避）
    // if (positions.some(p => p.name !== 'CEO')) {
    //   nodes.push({
    //     id: 'cxo-layer',
    //     type: NodeType.CXO_LAYER,
    //     position: { x: 200, y: 250 },
    //     data: {
    //       entity: { id: 'cxo-layer', name: 'CXOレイヤー' },
    //       label: 'CXOレイヤー',
    //       containerSize: { width: 800, height: 200 },
    //       business_id: null // CXOレイヤーは会社レベル
    //     },
    //     draggable: true,
    //     selectable: true
    //   })
    // }
    
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
            size: { width: 224, height: 120 },
            business_id: (position as any).business_id || null // CXOは通常null（会社レベル）
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
      // デバッグ: レイヤーの位置・サイズ情報をログ出力
      console.log('📋 LAYER POSITION & SIZE DATA:', {
        id: layer.id,
        name: layer.name,
        position_x: (layer as any).position_x,
        position_y: (layer as any).position_y,
        width: (layer as any).width,
        height: (layer as any).height,
        layer
      })
      
      const savedX = (layer as any).position_x
      const savedY = (layer as any).position_y
      const savedWidth = (layer as any).width
      const savedHeight = (layer as any).height
      const defaultPosition = { x: 100 + index * 600, y: 500 }
      const defaultSize = { width: 500, height: 600 }
      
      // 文字列の"0"も有効な位置として扱う
      const hasValidPosition = (savedX !== null && savedX !== undefined && savedY !== null && savedY !== undefined)
      const finalPosition = hasValidPosition
        ? { x: Number(savedX), y: Number(savedY) }
        : defaultPosition
      
      // サイズ情報も同様に処理
      const hasValidSize = (savedWidth !== null && savedWidth !== undefined && savedHeight !== null && savedHeight !== undefined)
      const finalSize = hasValidSize
        ? { width: Number(savedWidth), height: Number(savedHeight) }
        : defaultSize
      
      console.log('📋 FINAL LAYER POSITION & SIZE:', layer.name, finalPosition, finalSize)
      
      nodes.push({
        id: `layer-${layer.id}`,
        type: NodeType.BUSINESS_LAYER,
        position: finalPosition,
        data: {
          entity: layer,
          label: layer.name,
          type: layer.type as 'business' | 'management',
          containerSize: finalSize,
          business_id: (layer as any).business_id || null, // レイヤーのbusiness_id
          color: (layer as any).color || 'gray', // データベースのcolorカラムを使用
          description: (layer as any).description || '' // データベースのdescriptionカラムを使用
        },
        draggable: true,
        selectable: true
      })
    })
    
    // 事業ノード - 独立配置（レイヤーに属さない）
    businesses.forEach((business, index) => {
      nodes.push({
        id: `business-${business.id}`,
        type: NodeType.BUSINESS,
        position: { 
          x: business.position_x !== null && business.position_x !== undefined 
            ? Number(business.position_x) 
            : 50 + (index % 3) * 280, 
          y: business.position_y !== null && business.position_y !== undefined 
            ? Number(business.position_y) 
            : 50 + Math.floor(index / 3) * 200
        },
        data: {
          entity: business,
          label: business.name,
          size: { width: 256, height: 160 },
          business_id: business.id // 事業自身のID
        },
        // parentNode削除: 事業は独立ノード
        draggable: true,
        selectable: true
      })
    })
    
    // 業務ノード - 必ず事業ノード内に配置
    tasks.forEach((task, index) => {
      if (!task.business_id) {
        console.error('Task without business_id found:', task.id, task.name)
        return // 業務は必ずbusiness_idを持つべき
      }
      const parentId = `business-${task.business_id}`
      
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
          size: { width: 224, height: 100 },
          business_id: task.business_id // business_id統合完了
        },
        // parentNode: parentId, // 業務ノードを独立ノードに変更
        // extent: 'parent' as const,
        draggable: true,
        selectable: true
      })
    })
    
    // 実行者ノード - 業務ノード内に配置（業務→事業の階層経由）
    executors.forEach((executor, index) => {
      if (!executor.task_id) {
        console.error('Executor without task_id found:', executor.id, executor.name)
        return // 実行者は必ずtask_idを持つべき
      }
      
      const task = tasks.find(t => t.id === executor.task_id)
      if (!task) {
        console.error('Executor references non-existent task:', executor.task_id)
        return
      }
      
      if (!task.business_id) {
        console.error('Executor task without business_id:', task.id, task.name)
        return
      }
      
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
          size: { width: 192, height: 80 },
          business_id: task.business_id // 所属業務の事業ID
        },
        // parentNode: `task-${executor.task_id}`, // 実行者ノードを独立ノードに変更
        // extent: 'parent' as const,
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

    // 固定エッジ生成を廃止：全てのエッジはデータベース管理に統一
    console.log('📊 USING DATABASE EDGES ONLY - No static edge generation')
    
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
        
        // エッジでつながっているノードも含めて表示するノードを決定
        const connectedNodeIds = new Set<string>()
        
        // 基本の事業関連ノードを追加
        connectedNodeIds.add(`business-${selectedBusinessId}`)
        selectedBusinessTaskIds.forEach(taskId => connectedNodeIds.add(`task-${taskId}`))
        selectedBusinessExecutorIds.forEach(executorId => connectedNodeIds.add(`executor-${executorId}`))
        
        // エッジでつながっているノードを追加
        edges.forEach(edge => {
          const sourceNodeId = edge.source
          const targetNodeId = edge.target
          
          // 選択された事業のノードから接続されているノードを追加
          if (connectedNodeIds.has(sourceNodeId)) {
            connectedNodeIds.add(targetNodeId)
          }
          // 選択された事業のノードに接続されているノードを追加  
          if (connectedNodeIds.has(targetNodeId)) {
            connectedNodeIds.add(sourceNodeId)
          }
        })
        
        // レイヤーノードとつながっているノードを含めてフィルタリング
        nodes = nodes.filter(node => {
          // 事業レイヤーは常に表示
          if (node.type === 'business_layer') return true
          
          // つながっているノードを表示
          if (connectedNodeIds.has(node.id)) return true
          
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
        
        // エッジでつながっているノードも含めて表示するノードを決定
        const connectedNodeIds = new Set<string>()
        
        // 基本の事業関連ノードを追加
        connectedNodeIds.add(`business-${selectedBusinessId}`)
        selectedBusinessTaskIds.forEach(taskId => connectedNodeIds.add(`task-${taskId}`))
        selectedBusinessExecutorIds.forEach(executorId => connectedNodeIds.add(`executor-${executorId}`))
        
        // エッジでつながっているノードを追加
        edges.forEach(edge => {
          const sourceNodeId = edge.source
          const targetNodeId = edge.target
          
          // 選択された事業のノードから接続されているノードを追加
          if (connectedNodeIds.has(sourceNodeId)) {
            connectedNodeIds.add(targetNodeId)
          }
          // 選択された事業のノードに接続されているノードを追加  
          if (connectedNodeIds.has(targetNodeId)) {
            connectedNodeIds.add(sourceNodeId)
          }
        })
        
        // レイヤーノードとつながっているノードを含めてフィルタリング
        nodes = nodes.filter(node => {
          // 事業レイヤーはbusiness_id/attributeに基づいてフィルタリング（統合版）
          if (node.type === 'business_layer') {
            return this.shouldShowContainer({
              business_id: node.data.business_id
            }, selectedBusinessId)
          }
          
          // つながっているノードを表示
          if (connectedNodeIds.has(node.id)) return true
          
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
      // attributeが設定されていないレイヤーは会社属性で表示
      // （既存の動作を維持）
    }
    
    return { nodes, edges }
  }
}