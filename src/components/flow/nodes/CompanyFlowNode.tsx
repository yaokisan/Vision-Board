'use client'

import { Handle, Position } from '@xyflow/react'
import { useState } from 'react'
import { Company } from '@/types'
import { FlowNode } from '@/types/flow'

interface CompanyFlowNodeProps {
  data: FlowNode['data']
  onAddNode?: (parentId: string) => void
}

export default function CompanyFlowNode({ data, onAddNode }: CompanyFlowNodeProps) {
  const [isHovered, setIsHovered] = useState(false)
  const company = data.entity as Company
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-200 w-80" style={{ zIndex: 100 }}>
        {/* グラデーションバー */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl" />
        
        {/* メインコンテンツ */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-3">{company.name}</h2>
          
          {/* CEO情報 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">CEO</p>
            <p className="text-lg font-medium text-gray-800">{data.ceoName || '田中太郎'}</p>
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