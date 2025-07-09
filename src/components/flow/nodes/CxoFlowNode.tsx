'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Position as PositionType } from '@/types'
import { FlowNode } from '@/types/flow'

interface CxoFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

export default function CxoFlowNode({ data, onAddNode, onEditNode, onDeleteNode, id }: CxoFlowNodeProps & { id?: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const position = data.entity as PositionType
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-72">
        {/* 接続ポイント（上部） */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-md" />
        
        {/* メインコンテンツ */}
        <div className="p-4">
          <h3 className="text-3xl font-bold text-gray-800 mb-3 text-left">{position?.name || data.ceoName || data.label}</h3>
          <p className="text-2xl font-bold text-gray-700 text-center">{position?.person_name || 'ドラッグ&ドロップで追加されたCXO'}</p>
        </div>
        
        {/* 接続ポイント（下部） */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        
        {/* ホバー時のアクションボタン */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const nodeId = `position-${data.entity?.id}`
                onAddNode?.(nodeId)
              }}
              className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
              title="子ノード追加"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                const nodeId = `position-${data.entity?.id}`
                console.log('🎯 CXO EDIT CLICKED:', nodeId)
                onEditNode?.(nodeId)
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
                const nodeId = `position-${data.entity?.id}`
                console.log('🎯 CXO DELETE CLICKED:', nodeId)
                onDeleteNode?.(nodeId)
              }}
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
              title="削除"
            >
              ×
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