'use client'

import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react'
import { useState, useCallback } from 'react'

interface CxoLayerNodeProps {
  data: {
    label: string;
    containerSize: { width: number; height: number };
    description?: string;
    color?: string;
  }
  selected?: boolean
  id?: string
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

export default function CxoLayerNode({ data, selected, id, onEditNode, onDeleteNode }: CxoLayerNodeProps) {
  const [currentSize, setCurrentSize] = useState(data.containerSize)
  const [isHovered, setIsHovered] = useState(false)
  const { setNodes } = useReactFlow()

  // 色設定を取得
  const getColorConfig = () => {
    const colorName = data.color || 'purple'
    const colors: Record<string, any> = {
      gray: {
        bg: 'from-gray-50 to-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-800',
        subText: 'text-gray-600',
        resizer: '#6b7280'
      },
      blue: {
        bg: 'from-blue-50 to-blue-100',
        border: 'border-blue-300',
        text: 'text-blue-800',
        subText: 'text-blue-600',
        resizer: '#3b82f6'
      },
      green: {
        bg: 'from-green-50 to-green-100',
        border: 'border-green-300',
        text: 'text-green-800',
        subText: 'text-green-600',
        resizer: '#10b981'
      },
      purple: {
        bg: 'from-purple-50 to-blue-50',
        border: 'border-purple-300',
        text: 'text-purple-800',
        subText: 'text-purple-600',
        resizer: '#8b5cf6'
      },
      red: {
        bg: 'from-red-50 to-red-100',
        border: 'border-red-300',
        text: 'text-red-800',
        subText: 'text-red-600',
        resizer: '#ef4444'
      },
      yellow: {
        bg: 'from-yellow-50 to-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        subText: 'text-yellow-600',
        resizer: '#eab308'
      },
      indigo: {
        bg: 'from-indigo-50 to-indigo-100',
        border: 'border-indigo-300',
        text: 'text-indigo-800',
        subText: 'text-indigo-600',
        resizer: '#6366f1'
      },
      pink: {
        bg: 'from-pink-50 to-pink-100',
        border: 'border-pink-300',
        text: 'text-pink-800',
        subText: 'text-pink-600',
        resizer: '#ec4899'
      }
    }
    return colors[colorName] || colors.purple
  }

  const colorConfig = getColorConfig()
  const getBgColor = () => colorConfig.bg
  const getBorderColor = () => colorConfig.border
  const getTextColor = () => colorConfig.text
  const getSubTextColor = () => colorConfig.subText

  const handleResize = useCallback((event: any, params: any) => {
    const newSize = { width: params.width, height: params.height }
    setCurrentSize(newSize)
    
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                containerSize: newSize
              }
            }
          : node
      )
    )
  }, [id, setNodes])

  return (
    <div className="relative" style={{ zIndex: -10 }}>
      {/* リサイズハンドル */}
      <NodeResizer
        color={colorConfig.resizer}
        isVisible={selected}
        minWidth={400}
        minHeight={150}
        onResizeStart={() => {}}
        onResizeEnd={() => {}}
        onResize={handleResize}
        handleStyle={{
          width: '12px',
          height: '12px',
          backgroundColor: colorConfig.resizer,
          border: '2px solid white'
        }}
      />
      
      <div 
        className={`bg-gradient-to-br ${getBgColor()} border-2 ${getBorderColor()} rounded-xl p-6 shadow-lg relative`}
        style={{ 
          width: currentSize.width, 
          height: currentSize.height,
          minHeight: 150,
          zIndex: -10
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 className={`text-xl font-bold ${getTextColor()} mb-4 text-center`}>
          【{data.label || 'CXOレイヤー'}】
        </h2>
        <div className={`text-sm ${getSubTextColor()} text-center mb-4`}>
          {data.description || '経営陣・役職者エリア'}
        </div>
        
        {/* ホバー時のアクションボタン */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditNode?.(id || '')
              }}
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
              title="編集"
            >
              ✎
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNode?.(id || '')
              }}
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
              title="削除"
            >
              ×
            </button>
          </div>
        )}
        
        {/* 子ノード配置エリア */}
        <div className="flex-1 min-h-0">
          {/* React Flowが自動的に子ノードを配置 */}
        </div>
      </div>
      
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !shadow-md"
        style={{ top: '-6px', zIndex: 100 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !shadow-md"
        style={{ bottom: '-6px', zIndex: 100 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !shadow-md"
        style={{ left: '-6px', zIndex: 100 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white !shadow-md"
        style={{ right: '-6px', zIndex: 100 }}
      />
    </div>
  )
}