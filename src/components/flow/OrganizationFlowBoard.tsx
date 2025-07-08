'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  Node,
  useReactFlow,
  reconnectEdge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { NodeType, FlowNode } from '@/types/flow'
import { 
  CompanyFlowNode, 
  CxoFlowNode, 
  CxoLayerNode,
  BusinessLayerNode,
  BusinessFlowNode, 
  TaskFlowNode, 
  ExecutorFlowNode 
} from './nodes'
import { FlowDataConverter } from '@/lib/flow/dataConverter'
import { NodeDataService } from '@/lib/services/nodeDataService'
import { EdgeService } from '@/lib/services/edgeService'
import AddNodeModal from './AddNodeModal'
import InlineCardModal from './InlineCardModal'
import EditNodeModal from './EditNodeModal'
import DeleteConfirmPopup from './DeleteConfirmPopup'
import CustomEdge from './CustomEdge'
import NodeToolbar from './NodeToolbar'

// カスタムノードタイプマッピングを関数として定義（プロパティを渡すため）
const createNodeTypes = (onAddNode: (parentId: string, event?: React.MouseEvent) => void, onEditNode: (nodeId: string) => void, onDeleteNode: (nodeId: string) => void) => ({
  [NodeType.COMPANY]: (props: any) => <CompanyFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.CXO]: (props: any) => <CxoFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.CXO_LAYER]: (props: any) => <CxoLayerNode {...props} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.BUSINESS_LAYER]: (props: any) => <BusinessLayerNode {...props} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.BUSINESS]: (props: any) => <BusinessFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.TASK]: (props: any) => <TaskFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.EXECUTOR]: (props: any) => <ExecutorFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />
})

interface OrganizationFlowBoardProps {
  companies: any[]
  positions: any[]
  layers: any[]
  businesses: any[]
  tasks: any[]
  executors: any[]
  members: any[]
  currentUser: any
  viewMode?: 'company' | 'business'
  selectedBusinessId?: string | null
  // タブ別ノード位置保持機能
  nodePositions?: Record<string, { x: number; y: number }>
  onNodePositionUpdate?: (nodeId: string, position: { x: number; y: number }) => void
}

export default function OrganizationFlowBoard({
  companies,
  positions,
  layers,
  businesses,
  tasks,
  executors,
  members,
  currentUser,
  viewMode = 'company' as 'company' | 'business',
  selectedBusinessId,
  nodePositions = {},
  onNodePositionUpdate
}: OrganizationFlowBoardProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedParentNode, setSelectedParentNode] = useState<{ id: string; type: NodeType } | null>(null)
  const [isInlineModalOpen, setIsInlineModalOpen] = useState(false)
  const [inlineModalPosition, setInlineModalPosition] = useState({ x: 0, y: 0 })
  const [editingNode, setEditingNode] = useState<{ id: string; type: string; data: any } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean; 
    nodeId: string; 
    position: { x: number; y: number }; 
    nodeLabel: string 
  }>({
    isOpen: false,
    nodeId: '',
    position: { x: 0, y: 0 },
    nodeLabel: ''
  })

  // 接続線再接続の状態管理
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectingEdge, setReconnectingEdge] = useState<Edge | null>(null)
  const { getNodes, getViewport } = useReactFlow()
  const [currentZoom, setCurrentZoom] = useState(70)
  const [isMounted, setIsMounted] = useState(false)
  
  // 固定エッジ廃止：全エッジがデータベース管理

  // クライアントサイドマウント確認
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // データ変換とReact Flow初期化（nodePositionsの更新は別途管理）
  useEffect(() => {
    if (!isMounted) return
    
    console.log('🔴 useEffect TRIGGERED - Dependencies changed:', {
      companies: companies.length,
      positions: positions.length,
      viewMode,
      selectedBusinessId,
      timestamp: new Date().toISOString()
    })
    
    const loadFlowData = async () => {
      try {
        const flowData = await FlowDataConverter.convertToFlowDataWithContainerFilter(
          companies,
          positions,
          layers,
          businesses,
          tasks,
          executors,
          currentUser.company_id,
          viewMode,
          selectedBusinessId
        )
        
        console.log('🟡 SETTING NODES - Count:', flowData.nodes.length, 'at', new Date().toISOString())
        setNodes(flowData.nodes)
        setEdges(flowData.edges)
        setIsLoading(false)
        
        // 初期ズーム率を設定
        setTimeout(() => {
          const viewport = getViewport()
          setCurrentZoom(Math.round(viewport.zoom * 100))
        }, 100)
      } catch (error) {
        console.error('Flow data conversion error:', error)
        setIsLoading(false)
      }
    }
    
    loadFlowData()
  }, [companies, positions, layers, businesses, tasks, executors, viewMode, selectedBusinessId, isMounted, setNodes, setEdges, getViewport, currentUser.company_id])

  // ノード位置の復元を別のuseEffectで管理
  useEffect(() => {
    if (!isMounted || Object.keys(nodePositions).length === 0) return

    console.log('📍 RESTORING NODE POSITIONS:', Object.keys(nodePositions).length, 'positions')
    
    setNodes(currentNodes => 
      currentNodes.map(node => {
        const savedPosition = nodePositions[node.id]
        if (savedPosition) {
          console.log('📍 RESTORING POSITION for', node.id, savedPosition)
          return {
            ...node,
            position: savedPosition
          }
        }
        return node
      })
    )
  }, [nodePositions, isMounted, setNodes])

  // データリロード用の関数
  const reloadData = useCallback(async () => {
    try {
      const flowData = await FlowDataConverter.convertToFlowDataWithContainerFilter(
        companies,
        positions,
        layers,
        businesses,
        tasks,
        executors,
        currentUser.company_id,
        viewMode,
        selectedBusinessId
      )
      
      console.log('🔄 RELOADING DATA - Nodes:', flowData.nodes.length, 'Edges:', flowData.edges.length)
      setNodes(flowData.nodes)
      setEdges(flowData.edges)
    } catch (error) {
      console.error('Data reload error:', error)
    }
  }, [companies, positions, layers, businesses, tasks, executors, currentUser.company_id, viewMode, selectedBusinessId, setNodes, setEdges])

  // エッジ接続ハンドラー
  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return
    
    // すべての接続線を青色で統一
    const edgeColor = '#4c6ef5' // 青色
    const strokeWidth = 2
    const edgeStyle = { 
      stroke: edgeColor, 
      strokeWidth: strokeWidth,
      strokeDasharray: '2,4'
    }
    
    console.log('🔗 CONNECTING NODES:', params)
    
    // データベースに保存
    const saveResult = await NodeDataService.saveEdge(
      currentUser.company_id,
      params.source,
      params.target,
      {
        type: 'default',
        style: edgeStyle,
        animated: true,
        reconnectable: true,
        deletable: true
      }
    )
    
    if (!saveResult.success) {
      console.error('❌ EDGE SAVE FAILED:', saveResult.error)
      // TODO: ユーザーにエラー表示
      return
    }
    
    console.log('✅ EDGE SAVED SUCCESSFULLY:', saveResult.edgeId)
    
    // React Flow状態更新
    setEdges((eds) => addEdge({
      ...params,
      id: saveResult.edgeId!, // データベースのIDを使用
      type: 'default',
      style: edgeStyle,
      animated: true,
      reconnectable: true,
      deletable: true
    }, eds))
    
    // 🔄 一時的に無効化: エッジ作成直後のリロードがノード消失を引き起こす
    // await reloadData()
    console.log('🔄 Edge creation completed, reloadData temporarily disabled to prevent node deletion')
  }, [setEdges, currentUser.company_id, reloadData])

  // ノード移動保存ハンドラー
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log('🔵 DRAG STOP:', node.id, node.position, 'at', new Date().toISOString())
      // タブ別ノード位置保持機能
      if (onNodePositionUpdate) {
        onNodePositionUpdate(node.id, node.position)
      }
    },
    [onNodePositionUpdate]
  )

  // business_id統合: 現在のタブコンテキストに基づいて適切なbusiness_idを取得
  const getCurrentBusinessId = useCallback(() => {
    // 事業ビューで特定の事業が選択されている場合、その事業IDを返す
    if (viewMode === 'business' && selectedBusinessId) {
      return selectedBusinessId
    }
    // それ以外の場合は会社レベル（nullを返す）
    return null
  }, [viewMode, selectedBusinessId])


  // ノード追加ハンドラー
  const handleAddNode = useCallback(
    async (nodeType: NodeType, nodeData: any) => {
      console.log('🟠 HANDLE ADD NODE CALLED:', { nodeType, nodeData })
      let finalNodeType = nodeType
      let finalData = { ...nodeData }
      
      // business_id統合完了: 現在のタブコンテキストに基づいて自動設定
      const currentBusinessId = getCurrentBusinessId()
      
      // business_idを設定
      finalData.business_id = finalData.business_id || currentBusinessId
      
      // 事業ノードの場合は特別な処理（後でIDが決まった時に自分自身のIDに設定される）
      if (finalNodeType === NodeType.BUSINESS) {
        // NodeDataServiceで後処理されるため、ここでは現在の属性を設定
        console.log('🏢 BUSINESS NODE: attribute will be set to its own ID after save')
      }
      
      console.log('🏷️ AUTO-ASSIGNED business_id:', {
        business_id: currentBusinessId,
        nodeType: finalNodeType
      })
      
      // コンテナタイプの処理
      if (nodeType === 'container' as NodeType) {
        finalNodeType = NodeType.BUSINESS_LAYER
        finalData = {
          ...nodeData,
          label: nodeData.title || 'New Container',
          type: nodeData.color === 'purple' ? 'management' : 'business',
          containerSize: { width: 500, height: 400 },
          business_id: finalData.business_id // business_idを設定
        }
      }

      const position = { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      }

      // データベースに保存
      console.log('💾 SAVING NODE TO DATABASE:', { finalNodeType, finalData, position })
      const saveResult = await NodeDataService.saveNewNode({
        nodeType: finalNodeType,
        data: finalData,
        position,
        parentNodeId: selectedParentNode?.id,
        companyId: currentUser.company_id
      })

      if (!saveResult.success) {
        console.error('❌ NODE SAVE FAILED:', saveResult.error)
        // TODO: ユーザーにエラー表示
        return
      }

      console.log('✅ NODE SAVED SUCCESSFULLY:', saveResult.nodeId)

      // 保存成功後、React Flow状態を更新
      const newNode: FlowNode = {
        id: `${finalNodeType.toLowerCase()}-${saveResult.nodeId}`, // データベースのIDを使用
        type: finalNodeType,
        position,
        data: {
          entity: { ...finalData, id: saveResult.nodeId }, // データベースIDを追加
          label: finalData.name || finalData.person_name || finalData.title || 'New Node',
          size: finalData.containerSize || { width: 224, height: 120 },
          ...(finalNodeType === NodeType.BUSINESS_LAYER && {
            type: finalData.type,
            containerSize: finalData.containerSize
          })
        },
        parentNode: selectedParentNode?.id,
        extent: selectedParentNode ? 'parent' as const : undefined,
        draggable: true,
        selectable: true
      }

      setNodes((nds) => [...nds, newNode])
      
      // 自動接続エッジを追加
      if (selectedParentNode) {
        const newEdge = {
          id: `${selectedParentNode.id}-${newNode.id}`,
          source: selectedParentNode.id,
          target: newNode.id,
          type: 'default',
          style: { 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true
        }
        setEdges((eds) => [...eds, newEdge])
      }
    },
    [selectedParentNode, setNodes, setEdges, currentUser.company_id, getCurrentBusinessId]
  )

  // コンテナクリックでノード追加モーダルを開く
  const handleContainerClick = useCallback(
    (parentNodeId: string, parentNodeType: NodeType) => {
      setSelectedParentNode({ id: parentNodeId, type: parentNodeType })
      setIsAddModalOpen(true)
    },
    []
  )

  // カードのプラスボタンクリックでインラインモーダルを開く
  const handleCardPlusClick = useCallback(
    (parentEntityId: string, event?: React.MouseEvent) => {
      console.log('🔵 handleCardPlusClick called:', { parentEntityId, event: !!event, nodes: nodes.length })
      
      if (event) {
        // ボタンの位置を取得してモーダルを表示
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        setInlineModalPosition({ 
          x: rect.left + window.scrollX, 
          y: rect.bottom + window.scrollY + 10 
        })
      } else {
        // デフォルト位置
        setInlineModalPosition({ x: 300, y: 300 })
      }
      
      // 親ノードを正しく設定（複数の方法で検索）
      let parentNode = nodes.find(node => 
        node.data.entity.id === parentEntityId || 
        node.id === parentEntityId
      )
      
      // 見つからない場合、entity IDからnode IDを推測して検索
      if (!parentNode) {
        const possibleNodeIds = [
          `company-${parentEntityId}`,
          `position-${parentEntityId}`,
          `business-${parentEntityId}`,
          `task-${parentEntityId}`,
          `executor-${parentEntityId}`,
          `layer-${parentEntityId}`
        ]
        
        parentNode = nodes.find(node => 
          possibleNodeIds.includes(node.id)
        )
      }
      
      console.log('🔍 Parent node search result:', { 
        parentEntityId, 
        parentNode: parentNode ? { id: parentNode.id, type: parentNode.type } : null,
        totalNodes: nodes.length,
        nodeIds: nodes.map(n => ({ id: n.id, entityId: n.data.entity?.id }))
      })
      
      if (parentNode) {
        console.log('✅ Setting parent node:', { id: parentNode.id, type: parentNode.type })
        setSelectedParentNode({ id: parentNode.id, type: parentNode.type as NodeType })
      } else {
        console.warn('❌ Parent node not found for entity ID:', parentEntityId)
        // デフォルトとして会社ノードに設定
        const companyNode = nodes.find(node => node.type === NodeType.COMPANY)
        if (companyNode) {
          console.log('🏢 Using company node as fallback:', companyNode.id)
          setSelectedParentNode({ id: companyNode.id, type: NodeType.COMPANY })
        }
      }
      console.log('📂 Opening inline modal')
      setIsInlineModalOpen(true)
    },
    [nodes]
  )

  // インラインモーダルでのカード作成
  const handleInlineCardCreate = useCallback(
    (cardType: string, cardData: any) => {
      const nodeType = cardType as NodeType
      handleAddNode(nodeType, cardData)
      setIsInlineModalOpen(false)
      setSelectedParentNode(null)
    },
    [handleAddNode]
  )

  // ノード編集ハンドラー
  const handleEditNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        setEditingNode({ id: nodeId, type: node.type, data: node.data })
        setIsEditModalOpen(true)
      }
    },
    [nodes]
  )

  // ノード編集保存ハンドラー
  const handleSaveEditNode = useCallback(
    async (nodeId: string, updatedData: any) => {
      console.log('💾 SAVING NODE EDIT DATA:', { nodeId, updatedData })
      
      // データベースに保存
      const saveResult = await NodeDataService.updateNode(nodeId, updatedData)
      
      if (!saveResult.success) {
        console.error('❌ NODE UPDATE FAILED:', saveResult.error)
        // TODO: ユーザーにエラー表示
        return
      }
      
      console.log('✅ NODE UPDATED SUCCESSFULLY')
      
      // データベース保存成功後、React Flow状態を更新
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // コンテナの場合は特別な処理
            if (node.type === NodeType.BUSINESS_LAYER || node.type === NodeType.CXO_LAYER) {
              return {
                ...node,
                data: {
                  ...node.data,
                  entity: { ...node.data.entity, ...updatedData },
                  label: updatedData.name || node.data.label,
                  type: updatedData.type,
                  description: updatedData.description,
                  color: updatedData.color,
                  attribute: updatedData.attribute
                }
              }
            }
            // 通常のノードの処理
            return {
              ...node,
              data: {
                ...node.data,
                entity: { ...node.data.entity, ...updatedData },
                label: updatedData.name || updatedData.person_name || updatedData.title || node.data.label
              }
            }
          }
          return node
        })
      )
      setIsEditModalOpen(false)
      setEditingNode(null)
    },
    [setNodes]
  )

  // ノード削除ハンドラー
  const handleDeleteNode = useCallback(
    (nodeId: string, event?: React.MouseEvent) => {
      const node = nodes.find(n => n.id === nodeId)
      const nodeLabel = node?.data?.label || node?.data?.entity?.name || 'ノード'
      
      let position = { x: 300, y: 300 }
      if (event) {
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        position = { 
          x: rect.left + window.scrollX - 100, 
          y: rect.bottom + window.scrollY + 10 
        }
      }
      
      setDeleteConfirm({
        isOpen: true,
        nodeId,
        position,
        nodeLabel
      })
    },
    [nodes]
  )

  // 削除確認ハンドラー
  const handleConfirmDelete = useCallback(async () => {
    const { nodeId } = deleteConfirm
    
    console.log('🗑️ DELETING NODE:', nodeId)
    
    // データベースから削除
    const deleteResult = await NodeDataService.deleteNode(nodeId)
    
    if (!deleteResult.success) {
      console.error('❌ NODE DELETE FAILED:', deleteResult.error)
      // TODO: ユーザーにエラー表示
      return
    }
    
    console.log('✅ NODE DELETED SUCCESSFULLY')
    
    // React Flow状態から削除
    setNodes((nds) => nds.filter(node => node.id !== nodeId))
    // 関連するエッジを削除
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId))
    setDeleteConfirm({ isOpen: false, nodeId: '', position: { x: 0, y: 0 }, nodeLabel: '' })
  }, [deleteConfirm, setNodes, setEdges])

  // 削除キャンセルハンドラー
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirm({ isOpen: false, nodeId: '', position: { x: 0, y: 0 }, nodeLabel: '' })
  }, [])

  // ドラッグ&ドロップでノード追加
  const handleNodeDrop = useCallback(async (nodeType: NodeType, position: { x: number, y: number }) => {
    console.log('🎯 DRAG DROP NODE:', { nodeType, position })
    
    // 現在のタブコンテキストに基づいて属性を自動設定
    const currentBusinessId = getCurrentBusinessId()
    
    // デフォルトデータを準備
    const defaultData = {
      name: getDefaultNodeLabel(nodeType),
      business_id: currentBusinessId, // 属性を自動設定
      ...(nodeType === NodeType.CXO && { person_name: '' }),
      ...(nodeType === NodeType.BUSINESS && { goal: '', responsible_person: '' }),
      ...(nodeType === NodeType.TASK && { goal: '', responsible_person: '' }),
      ...(nodeType === NodeType.EXECUTOR && { role: '' }),
      ...(nodeType === NodeType.BUSINESS_LAYER && { 
        type: 'business',
        title: getDefaultNodeLabel(nodeType)
      })
    }
    
    console.log('🏷️ DRAG-DROP AUTO-ASSIGNED business_id:', currentBusinessId, 'for node type:', nodeType)

    // データベースに保存
    console.log('💾 SAVING DRAG-DROPPED NODE TO DATABASE:', { nodeType, defaultData, position })
    const saveResult = await NodeDataService.saveNewNode({
      nodeType,
      data: defaultData,
      position,
      parentNodeId: undefined, // ドラッグ&ドロップは親なし
      companyId: currentUser.company_id
    })

    if (!saveResult.success) {
      console.error('❌ DRAG-DROP NODE SAVE FAILED:', saveResult.error)
      // TODO: ユーザーにエラー表示
      return
    }

    console.log('✅ DRAG-DROP NODE SAVED SUCCESSFULLY:', saveResult.nodeId)

    // 保存成功後、React Flow状態を更新
    const newNode: FlowNode = {
      id: `${nodeType.toLowerCase()}-${saveResult.nodeId}`, // データベースIDを使用
      type: nodeType,
      position,
      data: {
        entity: { ...defaultData, id: saveResult.nodeId }, // データベースIDを追加
        label: getDefaultNodeLabel(nodeType),
        ...(nodeType === NodeType.CXO && { ceoName: getDefaultNodeLabel(nodeType) }),
        ...(nodeType === NodeType.BUSINESS_LAYER && { 
          type: defaultData.type as "business" | "management",
          containerSize: { width: 300, height: 200 },
          size: { width: 300, height: 200 }
        })
      }
    }
    
    setNodes((nds) => [...nds, newNode])
  }, [setNodes, currentUser.company_id, getCurrentBusinessId])

  // デフォルトノードラベルを取得
  const getDefaultNodeLabel = (nodeType: NodeType): string => {
    switch (nodeType) {
      case NodeType.CXO:
        return '新しいCXO'
      case NodeType.BUSINESS:
        return '新しい事業'
      case NodeType.TASK:
        return '新しい業務'
      case NodeType.EXECUTOR:
        return '新しい実行者'
      case NodeType.BUSINESS_LAYER:
        return '新しいコンテナ'
      default:
        return '新しいノード'
    }
  }

  // ドロップイベントハンドラー
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    
    const reactFlowBounds = event.currentTarget.getBoundingClientRect()
    const data = event.dataTransfer.getData('application/reactflow')
    
    if (!data) return
    
    try {
      const { type } = JSON.parse(data)
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top
      }
      
      handleNodeDrop(type, position)
    } catch (error) {
      console.error('ドロップデータの解析エラー:', error)
    }
  }, [handleNodeDrop])

  // ドラッグオーバーハンドラー
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])


  // 接続線再接続ハンドラー
  const onReconnect = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
    console.log('✅ 接続線を再接続:', oldEdge, newConnection)
    
    if (!newConnection.source || !newConnection.target) return
    
    // データベースで更新
    const updateResult = await NodeDataService.updateEdge(
      oldEdge.id,
      newConnection.source,
      newConnection.target,
      currentUser.company_id
    )
    
    if (!updateResult.success) {
      console.error('❌ EDGE RECONNECT FAILED:', updateResult.error)
      // TODO: ユーザーにエラー表示
      return
    }
    
    console.log('✅ EDGE RECONNECTED SUCCESSFULLY:', oldEdge.id)
    
    // React Flow状態で更新
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
    
    // 🔄 追加: business_id変更による影響をリアルタイム反映
    await reloadData()
    console.log('🔄 Data reloaded after edge reconnection')
  }, [setEdges, reloadData, currentUser.company_id])

  // 接続可能性チェック
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(node => node.id === connection.source)
    const targetNode = nodes.find(node => node.id === connection.target)
    
    if (!sourceNode || !targetNode) return false
    
    // 同じノードへの接続は禁止
    if (connection.source === connection.target) return false
    
    // 循環参照チェック（簡易版）
    if (edges.some(edge => 
      edge.source === connection.target && edge.target === connection.source
    )) return false
    
    // カスタム接続ルール（例：会社→CXO、CXO→事業など）
    const sourceType = sourceNode.type
    const targetType = targetNode.type
    
    // 基本的な階層ルール
    const validConnections: Record<NodeType, NodeType[]> = {
      [NodeType.COMPANY]: [NodeType.CXO, NodeType.CXO_LAYER, NodeType.BUSINESS_LAYER, NodeType.BUSINESS],
      [NodeType.CXO]: [NodeType.BUSINESS, NodeType.BUSINESS_LAYER, NodeType.CXO_LAYER],
      [NodeType.POSITION]: [NodeType.BUSINESS, NodeType.BUSINESS_LAYER, NodeType.CXO_LAYER],
      [NodeType.CXO_LAYER]: [NodeType.CXO, NodeType.BUSINESS_LAYER],
      [NodeType.BUSINESS_LAYER]: [NodeType.BUSINESS, NodeType.TASK],
      [NodeType.BUSINESS]: [NodeType.TASK, NodeType.EXECUTOR],
      [NodeType.TASK]: [NodeType.EXECUTOR],
      [NodeType.EXECUTOR]: [],
    }
    
    return validConnections[sourceType]?.includes(targetType) || false
  }, [nodes, edges])

  // 接続線再接続開始ハンドラー
  const onReconnectStart = useCallback((_: any, edge: Edge) => {
    console.log('🔄 接続線再接続開始:', edge)
    setIsReconnecting(true)
    setReconnectingEdge(edge)
  }, [])

  // 接続線再接続終了ハンドラー
  const onReconnectEnd = useCallback(() => {
    console.log('🔄 接続線再接続終了')
    setIsReconnecting(false)
    setReconnectingEdge(null)
  }, [])

  // エッジ削除ハンドラー
  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    console.log('🗑️ 接続線を削除:', edgesToDelete)
    console.log('🗑️ 削除対象エッジの詳細:', edgesToDelete.map(edge => ({ 
      id: edge.id, 
      source: edge.source, 
      target: edge.target,
      deletable: edge.deletable
    })))
    
    // データベースから削除とbusiness_id影響分析処理
    let hasSuccess = false
    for (const edge of edgesToDelete) {
      // データベースからエッジを削除（business_id影響分析付き）
      const deleteResult = await NodeDataService.deleteEdge(edge.id, currentUser.company_id)
      if (!deleteResult.success) {
        console.error('❌ EDGE DELETE FAILED:', edge.id, deleteResult.error)
        // TODO: ユーザーにエラー表示
        continue
      } else {
        console.log('✅ EDGE DELETED WITH IMPACT ANALYSIS:', edge.id)
        hasSuccess = true
      }
    }
    
    // 削除成功時：React Flow状態から削除 + データリロード
    if (hasSuccess) {
      setEdges((eds) => eds.filter(edge => !edgesToDelete.some(delEdge => delEdge.id === edge.id)))
      
      // business_id変更による影響をリアルタイム反映
      await reloadData()
      console.log('🔄 Data reloaded after edge deletion')
    }
  }, [setEdges, reloadData, currentUser.company_id])

  // ビューポート変更ハンドラー（ズーム率表示用）
  const onMove = useCallback(() => {
    const viewport = getViewport()
    setCurrentZoom(Math.round(viewport.zoom * 100))
  }, [getViewport])

  // ノードタイプマッピングを作成（メモ化）
  const nodeTypes = useMemo(
    () => createNodeTypes(handleCardPlusClick, handleEditNode, handleDeleteNode),
    [handleCardPlusClick, handleEditNode, handleDeleteNode]
  )
  
  // エッジタイプマッピング（メモ化）
  const edgeTypes = useMemo(() => ({
    default: CustomEdge
  }), [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gray-50">
      <style jsx global>{`
        .react-flow__node-business_layer,
        .react-flow__node-cxo_layer {
          z-index: -1 !important;
        }
        .react-flow__edge {
          z-index: 1000 !important;
          pointer-events: auto !important;
        }
        .react-flow__edge-path {
          pointer-events: auto !important;
        }
        .react-flow__edge-interaction {
          pointer-events: auto !important;
        }
        .react-flow__node:not(.react-flow__node-business_layer):not(.react-flow__node-cxo_layer) {
          z-index: 100 !important;
        }
        .react-flow__pane {
          cursor: default !important;
        }
        .react-flow__node {
          cursor: grab !important;
        }
        .react-flow__node.dragging {
          cursor: grabbing !important;
        }
        
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={(changes) => {
          console.log('🔄 EDGES CHANGE:', changes)
          
          // 削除イベントを検出して手動でonEdgesDeleteを呼び出す
          const removeChanges = changes.filter(change => change.type === 'remove')
          if (removeChanges.length > 0) {
            console.log('🗑️ DETECTED EDGE REMOVAL:', removeChanges)
            const edgesToDelete = removeChanges.map(change => 
              edges.find(edge => edge.id === change.id)
            ).filter(Boolean) as Edge[]
            
            if (edgesToDelete.length > 0) {
              // 非同期でonEdgesDeleteを実行
              onEdgesDelete(edgesToDelete)
            }
          }
          
          onEdgesChange(changes)
        }}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        isValidConnection={(connection) => isValidConnection(connection as Connection)}
        onNodeDragStop={onNodeDragStop}
        onEdgesDelete={onEdgesDelete}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onMove={onMove}
        deleteKeyCode={["Delete", "Backspace"]}
        onKeyDown={(event) => {
          console.log('🎹 KEY PRESSED:', event.key, event.code)
        }}
        fitView
        fitViewOptions={{ padding: 0.1, maxZoom: 0.7 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineStyle={{ 
          stroke: isReconnecting ? '#22c55e' : '#4c6ef5', 
          strokeWidth: 3,
          strokeDasharray: isReconnecting ? '10,5' : '0'
        }}
        defaultEdgeOptions={{
          type: 'default',
          style: { 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true,
          reconnectable: true,
          deletable: true
        }}
      >
        {/* 背景パターン */}
        <Background 
          color="#e5e7eb" 
          gap={20} 
          size={1}
        />
        
        {/* コントロールパネル */}
        <Controls 
          position="bottom-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        
        {/* ミニマップ */}
        <MiniMap 
          position="bottom-right"
          zoomable
          pannable
          style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            marginBottom: '60px',
            marginRight: '20px'
          }}
        />
        
        {/* 新しいノードツールバー */}
        <NodeToolbar onNodeDrop={handleNodeDrop} />

        {/* 情報パネル */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">組織図</h3>
          <div className="text-sm text-gray-600">
            <p>ノード数: {nodes.length}</p>
            <p>接続数: {edges.length}</p>
          </div>
        </Panel>

        {/* ズーム率表示 */}
        <div 
          className="fixed bottom-4 left-20 bg-black bg-opacity-75 text-white px-3 py-1 rounded-md text-sm font-medium z-50"
          style={{ pointerEvents: 'none' }}
        >
          ズーム: {currentZoom}%
        </div>
      </ReactFlow>

      {/* ノード追加モーダル */}
      <AddNodeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedParentNode(null)
        }}
        onAddNode={handleAddNode}
        parentNodeId={selectedParentNode?.id}
        parentNodeType={selectedParentNode?.type}
      />

      {/* インラインカード作成モーダル */}
      <InlineCardModal
        isOpen={isInlineModalOpen}
        onClose={() => {
          setIsInlineModalOpen(false)
          setSelectedParentNode(null)
        }}
        onCreateCard={handleInlineCardCreate}
        position={inlineModalPosition}
        parentId={selectedParentNode?.id}
      />

      {/* 編集モーダル */}
      <EditNodeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingNode(null)
        }}
        onSave={handleSaveEditNode}
        nodeData={editingNode}
        members={members}
        currentUser={currentUser}
        businesses={businesses}
        tasks={tasks}
      />

      {/* 削除確認ポップアップ */}
      <DeleteConfirmPopup
        isOpen={deleteConfirm.isOpen}
        position={deleteConfirm.position}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        nodeLabel={deleteConfirm.nodeLabel}
      />
    </div>
  )
}