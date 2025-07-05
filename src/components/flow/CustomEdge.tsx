'use client'

import { useState, useCallback } from 'react'
import { 
  getBezierPath, 
  EdgeProps, 
  useReactFlow,
  EdgeLabelRenderer,
  BaseEdge
} from '@xyflow/react'

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const { setEdges } = useReactFlow()
  const [isHovered, setIsHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onEdgeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }, [id, setEdges])

  const handleMouseEnter = useCallback(() => {
    console.log('Edge mouse enter:', id)
    setIsHovered(true)
  }, [id])

  const handleMouseLeave = useCallback(() => {
    console.log('Edge mouse leave:', id)
    setIsHovered(false)
  }, [id])

  return (
    <g>
      {/* 実際の表示パス */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="react-flow__edge-path"
      />
      
      {/* より太い透明なホバーエリア */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          cursor: 'pointer',
          pointerEvents: 'stroke'
        }}
        className="react-flow__edge-interaction"
      />
      
      <EdgeLabelRenderer>
        {isHovered && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 1001,
            }}
            className="nodrag nopan"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-colors border-2 border-white"
              onClick={onEdgeClick}
              title="接続を削除"
              onMouseEnter={(e) => e.stopPropagation()}
            >
              ×
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </g>
  )
}