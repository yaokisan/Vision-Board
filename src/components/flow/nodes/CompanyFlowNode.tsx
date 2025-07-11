'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Company } from '@/types'
import { FlowNode } from '@/types/flow'

interface CompanyFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string) => void
  onEditNode?: (nodeId: string) => void
}

export default function CompanyFlowNode({ data, onAddNode, onEditNode }: CompanyFlowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const company = data.entity as Company
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-[28rem]" style={{ zIndex: 100 }}>
        {/* グラデーションバー */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl" />
        
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-start p-4 pb-0">
          <div className="flex-1" />
          {/* 編集ボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const nodeId = `company-${data.entity.id}`
              onEditNode?.(nodeId)
            }}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm transition-colors"
          >
            ✏️
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="px-6 pb-6 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{company.name}</h2>
          
          {/* CEO情報 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-lg text-gray-600 mb-2 font-semibold">CEO</p>
            <p className="text-3xl font-bold text-gray-800">{data.ceoName || 'CEO未設定'}</p>
          </div>
        </div>
        
        {/* 接続ポイント */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        
        {/* ホバー時のプラスボタン */}
        {isHovered && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddNode?.(data.entity.id)
              }}
              className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg transition-colors z-50"
              style={{ zIndex: 1000 }}
            >
              +
            </button>
          </div>
        )}
      </div>
      
      {/* React Flow Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        style={{ bottom: '-8px', zIndex: 1000 }}
      />
    </div>
  )
}