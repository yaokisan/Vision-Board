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
  Node
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

// カスタムノードタイプマッピングを関数として定義（プロパティを渡すため）
const createNodeTypes = (onAddNode: (parentId: string) => void, onEditNode: (nodeId: string) => void, onDeleteNode: (nodeId: string) => void) => ({
  [NodeType.COMPANY]: (props: any) => <CompanyFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.CXO]: (props: any) => <CxoFlowNode {...props} onAddNode={onAddNode} onEditNode={onEditNode} onDeleteNode={onDeleteNode} />,
  [NodeType.CXO_LAYER]: CxoLayerNode,
  [NodeType.BUSINESS_LAYER]: BusinessLayerNode,
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
  const [editingNode, setEditingNode] = useState<{ id: string; data: any } | null>(null)
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
    } catch (error) {
      console.error('Flow data conversion error:', error)
      setIsLoading(false)
    }
  }, [companies, positions, layers, businesses, tasks, executors, setNodes, setEdges])

  // エッジ接続ハンドラー
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

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
        setEditingNode({ id: nodeId, data: node.data })
        setIsEditModalOpen(true)
      }
    },
    [nodes]
  )

  // ノード編集保存ハンドラー
  const handleSaveEditNode = useCallback(
    (nodeId: string, updatedData: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  entity: { ...node.data.entity, ...updatedData },
                  label: updatedData.name || updatedData.person_name || updatedData.title || node.data.label
                }
              }
            : node
        )
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

  // ノードタイプマッピングを作成（関数定義後に配置）
  const nodeTypes = createNodeTypes(handleCardPlusClick, handleEditNode, handleDeleteNode)

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        minZoom={0.1}
        maxZoom={2}
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineStyle={{ stroke: '#4c6ef5', strokeWidth: 2 }}
        defaultEdgeOptions={{
          style: { 
            strokeWidth: 2,
            strokeDasharray: '2,4'
          },
          animated: true
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
            border: '1px solid #e5e7eb'
          }}
        />
        
        {/* 情報パネル */}
        <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">組織図</h3>
          <div className="text-sm text-gray-600">
            <p>ノード数: {nodes.length}</p>
            <p>接続数: {edges.length}</p>
          </div>
        </Panel>

        {/* 追加ボタンパネル */}
        <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">ノード追加</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                setSelectedParentNode(null)
                setIsAddModalOpen(true)
              }}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              + 新規ノード
            </button>
            <button
              onClick={() => handleContainerClick('cxo-layer', NodeType.CXO_LAYER)}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
            >
              + CXOレイヤーに追加
            </button>
            {layers.map((layer: any) => (
              <button
                key={layer.id}
                onClick={() => handleContainerClick(`layer-${layer.id}`, NodeType.BUSINESS_LAYER)}
                className={`w-full px-3 py-2 text-white rounded-md text-sm ${
                  layer.type === 'business' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                + {layer.name}レイヤーに追加
              </button>
            ))}
          </div>
        </Panel>
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