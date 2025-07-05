'use client'

import { useCallback, useEffect, useState } from 'react'
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
import AddNodeModal from './AddNodeModal'
import InlineCardModal from './InlineCardModal'
import EditNodeModal from './EditNodeModal'
import DeleteConfirmPopup from './DeleteConfirmPopup'
import CustomEdge from './CustomEdge'
import NodeToolbar from './NodeToolbar'

// カスタムノードタイプマッピングを関数として定義（プロパティを渡すため）
const createNodeTypes = (onAddNode: (parentId: string) => void, onEditNode: (nodeId: string) => void, onDeleteNode: (nodeId: string) => void) => ({
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
}

export default function OrganizationFlowBoard({
  companies,
  positions,
  layers,
  businesses,
  tasks,
  executors
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

  // クライアントサイドマウント確認
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // データ変換とReact Flow初期化
  useEffect(() => {
    try {
      const flowData = FlowDataConverter.convertToFlowData(
        companies,
        positions,
        layers,
        businesses,
        tasks,
        executors
      )
      
      setNodes(flowData.nodes)
      setEdges(flowData.edges)
      setIsLoading(false)
      // 初期ズーム率を設定
      if (isMounted) {
        setTimeout(() => {
          const viewport = getViewport()
          setCurrentZoom(Math.round(viewport.zoom * 100))
        }, 100)
      }
    } catch (error) {
      console.error('Flow data conversion error:', error)
      setIsLoading(false)
    }
  }, [companies, positions, layers, businesses, tasks, executors, setNodes, setEdges, getViewport, isMounted])

  // エッジ接続ハンドラー
  const onConnect = useCallback((params: Connection) => {
    console.log('新しい接続:', params)
    
    // すべての接続線を青色で統一
    const edgeColor = '#4c6ef5' // 青色
    const strokeWidth = 2
    
    setEdges((eds) => addEdge({
      ...params,
      type: 'default',
      style: { 
        stroke: edgeColor, 
        strokeWidth: strokeWidth,
        strokeDasharray: '2,4'
      },
      animated: true,
      reconnectable: true,
      deletable: true
    }, eds))
  }, [setEdges, nodes])

  // ノード移動保存ハンドラー
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log('Node moved:', node.id, node.position)
      // TODO: データベースへの位置保存
    },
    []
  )

  // ノード追加ハンドラー
  const handleAddNode = useCallback(
    (nodeType: NodeType, nodeData: any) => {
      let finalNodeType = nodeType
      let finalData = { ...nodeData }
      
      // コンテナタイプの処理
      if (nodeType === 'container' as NodeType) {
        finalNodeType = NodeType.BUSINESS_LAYER
        finalData = {
          ...nodeData,
          label: nodeData.title || 'New Container',
          type: nodeData.color === 'purple' ? 'management' : 'business',
          containerSize: { width: 500, height: 400 }
        }
      }

      const newNode: FlowNode = {
        id: nodeData.id,
        type: finalNodeType,
        position: { 
          x: Math.random() * 200 + 100, 
          y: Math.random() * 200 + 100 
        },
        data: {
          entity: finalData,
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
          id: `${selectedParentNode.id}-${nodeData.id}`,
          source: selectedParentNode.id,
          target: nodeData.id,
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
    [selectedParentNode, setNodes, setEdges]
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
      console.log('Plus button clicked for parent entity:', parentEntityId)
      
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
      
      console.log('Found parent node:', parentNode)
      
      if (parentNode) {
        setSelectedParentNode({ id: parentNode.id, type: parentNode.type as NodeType })
      } else {
        console.warn('Parent node not found for entity ID:', parentEntityId)
        // デフォルトとして会社ノードに設定
        const companyNode = nodes.find(node => node.type === NodeType.COMPANY)
        if (companyNode) {
          setSelectedParentNode({ id: companyNode.id, type: NodeType.COMPANY })
        }
      }
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
    (nodeId: string, updatedData: any) => {
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
                  color: updatedData.color
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
  const handleConfirmDelete = useCallback(() => {
    const { nodeId } = deleteConfirm
    // ノードを削除
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
  const handleNodeDrop = useCallback((nodeType: NodeType, position: { x: number, y: number }) => {
    const newNode: FlowNode = {
      id: `${nodeType.toLowerCase()}-${Date.now()}`,
      type: nodeType,
      position,
      data: {
        entity: {},
        label: getDefaultNodeLabel(nodeType),
        ...(nodeType === NodeType.CXO && { ceoName: getDefaultNodeLabel(nodeType) }),
        ...(nodeType === NodeType.BUSINESS_LAYER && { 
          type: undefined, // 最初はプレーンコンテナ
          containerSize: { width: 300, height: 200 }
        })
      }
    }
    
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

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
  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    console.log('✅ 接続線を再接続:', oldEdge, newConnection)
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
  }, [setEdges])

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
      [NodeType.COMPANY]: [NodeType.CXO, NodeType.CXO_LAYER, NodeType.BUSINESS_LAYER],
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
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    console.log('🗑️ 接続線を削除:', edgesToDelete)
    setEdges((eds) => eds.filter(edge => !edgesToDelete.some(delEdge => delEdge.id === edge.id)))
  }, [setEdges])

  // ビューポート変更ハンドラー（ズーム率表示用）
  const onMove = useCallback(() => {
    const viewport = getViewport()
    setCurrentZoom(Math.round(viewport.zoom * 100))
  }, [getViewport])

  // ノードタイプマッピングを作成（関数定義後に配置）
  const nodeTypes = createNodeTypes(handleCardPlusClick, handleEditNode, handleDeleteNode)
  
  // エッジタイプマッピング
  const edgeTypes = {
    default: CustomEdge
  }

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
        onEdgesChange={onEdgesChange}
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
        deleteKeyCode="Delete"
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