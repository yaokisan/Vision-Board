'use client'

import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react'
import { useState, useCallback } from 'react'

interface BusinessLayerNodeProps {
  data: {
    label: string;
    type: 'business' | 'management';
    containerSize: { width: number; height: number };
  }
  selected?: boolean
  id?: string
}

export default function BusinessLayerNode({ data, selected, id }: BusinessLayerNodeProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [currentSize, setCurrentSize] = useState(data.containerSize)
  const { setNodes } = useReactFlow()
  const isBusiness = data.type === 'business'
  const bgColor = isBusiness ? 'from-green-50 to-emerald-50' : 'from-blue-50 to-cyan-50'
  const borderColor = isBusiness ? 'border-green-300' : 'border-blue-300'
  const textColor = isBusiness ? 'text-green-800' : 'text-blue-800'
  const subTextColor = isBusiness ? 'text-green-600' : 'text-blue-600'
  const resizerColor = isBusiness ? "#10b981" : "#3b82f6"

  const handleResize = useCallback((event: any, params: any) => {
    const newSize = { width: params.width, height: params.height }
    setCurrentSize(newSize)
    
    // ノードデータを更新
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
        color={resizerColor}
        isVisible={selected}
        minWidth={400}
        minHeight={300}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        onResize={handleResize}
        handleStyle={{
          width: '12px',
          height: '12px',
          backgroundColor: resizerColor,
          border: '2px solid white'
        }}
      />
      
      <div 
        className={`bg-gradient-to-br ${bgColor} border-2 ${borderColor} rounded-xl p-6 shadow-lg relative`}
        style={{ 
          width: currentSize.width, 
          height: currentSize.height,
          minHeight: 300,
          zIndex: -10
        }}
      >
        <h2 className={`text-xl font-bold ${textColor} mb-4 text-center`}>
          【{isBusiness ? '事業' : '経営'}レイヤー】
        </h2>
        <div className={`text-sm ${subTextColor} text-center mb-4`}>
          {isBusiness ? '事業・業務・実行者エリア' : '経営・戦略・管理エリア'}
        </div>
        
        {/* 子ノード配置エリア */}
        <div className="flex-1 min-h-0">
          {/* React Flowが自動的に子ノードを配置 */}
        </div>
        
        {/* コンテナ内追加ボタン */}
        <div className="absolute bottom-4 right-4">
          <button className={`w-8 h-8 ${isBusiness ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md transition-colors`}>
            +
          </button>
        </div>
      </div>
      
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0"
        style={{ top: '-8px', zIndex: 100 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0"
        style={{ bottom: '-8px', zIndex: 100 }}
      />
    </div>
  )
}