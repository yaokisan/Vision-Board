'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Business } from '@/types'
import { FlowNode } from '@/types/flow'

interface BusinessFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string, event?: React.MouseEvent) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string, event?: React.MouseEvent) => void
  id?: string
}

export default function BusinessFlowNode({ data, onAddNode, onEditNode, onDeleteNode, id }: BusinessFlowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const business = data.entity as Business
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-96">
        {/* 編集ボタン（左下） */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditNode?.(id || data.entity.id)
            }}
            className="absolute bottom-2 left-2 w-6 h-6 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-50"
            title="編集"
          >
            ✏️
          </button>
        )}
        
        {/* 削除ボタン（右上） */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteNode?.(id || data.entity.id, e)
            }}
            className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors z-50"
            title="削除"
          >
            ×
          </button>
        )}
        
        {/* 接続ポイント（上部） */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-md" />
        
        {/* メインコンテンツ */}
        <div className="p-4">
          <h3 className="text-3xl font-bold text-gray-800 mb-4 text-left">{business.name}</h3>
          
          {/* 目標 */}
          <div className="mb-4">
            <p className="text-lg text-gray-600 mb-2 font-semibold">目標</p>
            <p className="text-xl text-gray-800 leading-relaxed font-bold">{business.goal}</p>
          </div>
          
          {/* 責任者 */}
          <div className="border-2 border-red-200 rounded-lg p-3 bg-red-50 text-center">
            <p className="text-lg text-red-600 mb-2 font-semibold">責任者</p>
            <p className="text-3xl font-bold text-red-800">{business.responsible_person}</p>
          </div>
        </div>
        
        {/* 接続ポイント（下部） */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
        
        {/* ホバー時のプラスボタン */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const nodeId = id || data.entity.id
                console.log('🟢 BusinessFlowNode Plus Button Clicked:', { nodeId, id, entityId: data.entity.id, entity: data.entity })
                onAddNode?.(nodeId, e)
              }}
              className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
            >
              +
            </button>
          </div>
        )}
      </div>
      
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
        style={{ top: '-8px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        style={{ bottom: '-8px', zIndex: 1000 }}
      />
    </div>
  )
}