import React, { useState, useCallback, useRef, useEffect } from 'react'
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

export default function NodeToolbar(_: NodeToolbarProps) {
  const [draggedItem, setDraggedItem] = useState<ToolbarItem | null>(null)
  const [scale, setScale] = useState<number>(() => {
    // localStorageからリサイズ状態を復元
    if (typeof window !== 'undefined') {
      const savedScale = localStorage.getItem('node-toolbar-scale')
      return savedScale ? Number(savedScale) : 1
    }
    return 1
  })
  const [isResizing, setIsResizing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [resizeCorner, setResizeCorner] = useState<string>('')
  const panelRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<{ 
    startX: number; 
    startY: number; 
    startScale: number;
    initialWidth: number;
    initialHeight: number;
  }>({ startX: 0, startY: 0, startScale: 1, initialWidth: 0, initialHeight: 0 })
  
  const MIN_SCALE = 0.33 // 最小スケール（現在の約1/3）
  const MAX_SCALE = 1 // 最大スケール（現在のサイズ）
  const BASE_WIDTH = 100 // 基準幅
  const BASE_HEIGHT = 320 // 基準高さ（概算）

  const handleDragStart = useCallback((event: React.DragEvent, item: ToolbarItem) => {
    setDraggedItem(item)
    
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
  }, [])

  // リサイズ開始
  const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeCorner(corner)
    
    const rect = panelRef.current?.getBoundingClientRect()
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startScale: scale,
      initialWidth: rect?.width || BASE_WIDTH,
      initialHeight: rect?.height || BASE_HEIGHT
    }
  }, [scale])

  // リサイズ中の処理
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeRef.current.startX
      const deltaY = e.clientY - resizeRef.current.startY
      
      // コーナーに応じて適切なデルタを選択
      let delta = 0
      switch (resizeCorner) {
        case 'nw': // 左上
          delta = Math.min(-deltaX, -deltaY)
          break
        case 'ne': // 右上
          delta = Math.min(deltaX, -deltaY)
          break
        case 'sw': // 左下
          delta = Math.min(-deltaX, deltaY)
          break
        case 'se': // 右下
          delta = Math.min(deltaX, deltaY)
          break
      }
      
      // スケール計算（縦横比を維持）
      const scaleDelta = delta / Math.max(resizeRef.current.initialWidth, resizeRef.current.initialHeight)
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, resizeRef.current.startScale + scaleDelta))
      setScale(newScale)
      
      // localStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('node-toolbar-scale', String(newScale))
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeCorner('')
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, resizeCorner])

  return (
    <Panel position="top-left" className="relative">
      <div 
        ref={panelRef}
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 relative"
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          transition: isResizing ? 'none' : 'transform 0.2s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 四隅のリサイズハンドル - ホバーまたはリサイズ中のみ表示 */}
        {/* 左上 */}
        <div
          className={`absolute -top-1 -left-1 w-3 h-3 cursor-nw-resize rounded-full transition-opacity duration-200 ${
            isResizing && resizeCorner === 'nw' ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-500'
          } ${(isHovered || isResizing) ? 'opacity-100' : 'opacity-0'}`}
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
        {/* 右上 */}
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 cursor-ne-resize rounded-full transition-opacity duration-200 ${
            isResizing && resizeCorner === 'ne' ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-500'
          } ${(isHovered || isResizing) ? 'opacity-100' : 'opacity-0'}`}
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        {/* 左下 */}
        <div
          className={`absolute -bottom-1 -left-1 w-3 h-3 cursor-sw-resize rounded-full transition-opacity duration-200 ${
            isResizing && resizeCorner === 'sw' ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-500'
          } ${(isHovered || isResizing) ? 'opacity-100' : 'opacity-0'}`}
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        {/* 右下 */}
        <div
          className={`absolute -bottom-1 -right-1 w-3 h-3 cursor-se-resize rounded-full transition-opacity duration-200 ${
            isResizing && resizeCorner === 'se' ? 'bg-blue-500' : 'bg-gray-400 hover:bg-blue-500'
          } ${(isHovered || isResizing) ? 'opacity-100' : 'opacity-0'}`}
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        
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
              rounded-lg p-1.5 min-w-[50px]
              transform hover:scale-105 active:scale-95
              shadow-sm hover:shadow-md
              ${draggedItem?.type === item.type ? 'opacity-50' : ''}
            `}
            title={item.description}
          >
            <div className="flex flex-col items-center space-y-0.5">
              <span className="text-sm">{item.icon}</span>
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
      </div>
    </Panel>
  )
}