import React, { useState, useCallback } from 'react'
import { Panel } from '@xyflow/react'
import { NodeType } from '@/types/flow'

interface NodeToolbarProps {
  onNodeDrop: (nodeType: NodeType, position: { x: number; y: number }) => void
}

interface ToolbarItem {
  type: NodeType
  label: string
  icon: string
  color: string
  description: string
}

const toolbarItems: ToolbarItem[] = [
  {
    type: NodeType.CXO,
    label: 'CXO',
    icon: '👤',
    color: 'bg-blue-500 hover:bg-blue-600',
    description: 'CXO・役職カード'
  },
  {
    type: NodeType.BUSINESS,
    label: '事業',
    icon: '🚀',
    color: 'bg-green-500 hover:bg-green-600',
    description: '事業・部門カード'
  },
  {
    type: NodeType.TASK,
    label: '業務',
    icon: '💼',
    color: 'bg-orange-500 hover:bg-orange-600',
    description: '業務・タスクカード'
  },
  {
    type: NodeType.EXECUTOR,
    label: '実行者',
    icon: '⚡',
    color: 'bg-purple-500 hover:bg-purple-600',
    description: '実行者カード'
  },
  {
    type: NodeType.BUSINESS_LAYER,
    label: 'コンテナ',
    icon: '📦',
    color: 'bg-gray-500 hover:bg-gray-600',
    description: 'グループ化コンテナ'
  }
]

export default function NodeToolbar({ onNodeDrop }: NodeToolbarProps) {
  const [draggedItem, setDraggedItem] = useState<ToolbarItem | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = useCallback((event: React.DragEvent, item: ToolbarItem) => {
    setDraggedItem(item)
    setIsDragging(true)
    
    // ドラッグデータを設定
    event.dataTransfer.setData('application/reactflow', JSON.stringify({
      type: item.type,
      label: item.label
    }))
    event.dataTransfer.effectAllowed = 'move'
    
    // カスタムドラッグイメージを設定
    const dragElement = event.currentTarget as HTMLElement
    const rect = dragElement.getBoundingClientRect()
    event.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
    setIsDragging(false)
  }, [])

  return (
    <Panel position="top-left" className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 text-center mb-3">
          ノード追加
        </h3>
        
        {toolbarItems.map((item) => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            className={`
              group relative cursor-move transition-all duration-200
              ${item.color} text-white
              rounded-lg p-3 min-w-[120px] 
              transform hover:scale-105 active:scale-95
              shadow-sm hover:shadow-md
              ${draggedItem?.type === item.type ? 'opacity-50' : ''}
            `}
            title={item.description}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            
            {/* ホバー時の説明ツールチップ */}
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 
                          bg-gray-900 text-white text-xs px-2 py-1 rounded 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          pointer-events-none whitespace-nowrap z-50">
              {item.description}
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ドラッグしてキャンバスに配置
          </p>
        </div>
      </div>
      
    </Panel>
  )
}