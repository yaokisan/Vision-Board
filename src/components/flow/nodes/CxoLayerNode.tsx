'use client'

import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react'
import { useState, useCallback } from 'react'

interface CxoLayerNodeProps {
  data: {
    label: string;
    containerSize: { width: number; height: number };
  }
  selected?: boolean
  id?: string
}

export default function CxoLayerNode({ data, selected, id }: CxoLayerNodeProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [currentSize, setCurrentSize] = useState(data.containerSize)
  const { setNodes } = useReactFlow()

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
        color="#8b5cf6"
        isVisible={selected}
        minWidth={400}
        minHeight={150}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        onResize={handleResize}
        handleStyle={{
          width: '12px',
          height: '12px',
          backgroundColor: '#8b5cf6',
          border: '2px solid white'
        }}
      />
      
      <div 
        className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg relative"
        style={{ 
          width: currentSize.width, 
          height: currentSize.height,
          minHeight: 150,
          zIndex: -10
        }}
      >
        <h2 className="text-xl font-bold text-purple-800 mb-4 text-center">
          【CXOレイヤー】
        </h2>
        <div className="text-sm text-purple-600 text-center mb-4">
          経営陣・役職者エリア
        </div>
        
        {/* 子ノード配置エリア */}
        <div className="flex-1 min-h-0">
          {/* React Flowが自動的に子ノードを配置 */}
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