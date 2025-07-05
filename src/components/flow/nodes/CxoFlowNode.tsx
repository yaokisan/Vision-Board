'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Position as PositionType } from '@/types'
import { FlowNode } from '@/types/flow'

interface CxoFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string) => void
}

export default function CxoFlowNode({ data, onAddNode }: CxoFlowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const position = data.entity as PositionType
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-56">
        {/* 接続ポイント（上部） */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow-md" />
        
        {/* メインコンテンツ */}
        <div className="p-4 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{position.name}</h3>
          <p className="text-base text-gray-600">{position.person_name}</p>
        </div>
        
        {/* 接続ポイント（下部） */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        
        {/* ホバー時のプラスボタン */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddNode?.(data.entity.id)
              }}
              className="w-6 h-6 bg-purple-500 hover:bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
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