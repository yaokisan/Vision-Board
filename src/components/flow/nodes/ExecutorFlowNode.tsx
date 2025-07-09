'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Executor } from '@/types'
import { FlowNode } from '@/types/flow'

interface ExecutorFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string, event?: React.MouseEvent) => void
  id?: string
}

export default function ExecutorFlowNode({ data, onAddNode, onEditNode, onDeleteNode, id }: ExecutorFlowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const executor = data.entity as Executor
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-64">
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
        <div>
          {/* 業務名エリア（白背景） */}
          <div className="bg-white p-3 rounded-t-xl text-center">
            <p className="text-xl font-bold text-gray-800">{executor.role}</p>
          </div>
          
          {/* 担当者・名前エリア（青背景） */}
          <div className="bg-blue-100 p-3 rounded-b-xl text-center">
            <p className="text-base text-blue-600 mb-2 font-semibold">担当者</p>
            <p className="text-2xl font-bold text-blue-800">{executor.name}</p>
          </div>
        </div>
        
        {/* 接続ポイント（下部） */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        
        {/* ホバー時のプラスボタン */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddNode?.(id || data.entity.id)
              }}
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
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
        style={{ top: '-8px', zIndex: 1000 }}
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