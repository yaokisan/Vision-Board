'use client'

import React, { useState, useRef, useCallback } from 'react'

interface ResizableContainerProps {
  id: string
  children: React.ReactNode
  initialWidth?: number
  initialHeight?: number
  initialX?: number
  initialY?: number
  minWidth?: number
  minHeight?: number
  title: string
  onPositionChange?: (id: string, x: number, y: number) => void
  onSizeChange?: (id: string, width: number, height: number) => void
}

export default function ResizableContainer({
  id,
  children,
  initialWidth = 400,
  initialHeight = 500,
  initialX = 0,
  initialY = 0,
  minWidth = 300,
  minHeight = 200,
  title,
  onPositionChange,
  onSizeChange
}: ResizableContainerProps) {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY
  })
  
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, containerX: 0, containerY: 0, initialWidth: 0, initialHeight: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)

  // ドラッグ開始（移動）
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // リサイズハンドルがクリックされた場合は何もしない
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return
    }
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      containerX: dimensions.x,
      containerY: dimensions.y,
      initialWidth: dimensions.width,
      initialHeight: dimensions.height
    })
  }, [dimensions.x, dimensions.y, dimensions.width, dimensions.height])

  // リサイズ開始
  const handleResizeStart = useCallback((handle: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      containerX: dimensions.x,
      containerY: dimensions.y,
      initialWidth: dimensions.width,
      initialHeight: dimensions.height
    })
  }, [dimensions.x, dimensions.y, dimensions.width, dimensions.height])

  // マウス移動処理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = dragStart.containerX + (e.clientX - dragStart.x)
      const newY = dragStart.containerY + (e.clientY - dragStart.y)
      
      setDimensions(prev => ({ ...prev, x: newX, y: newY }))
      onPositionChange?.(id, newX, newY)
    } else if (isResizing) {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y
      
      setDimensions(prev => {
        let newWidth = prev.width
        let newHeight = prev.height
        let newX = prev.x
        let newY = prev.y

        switch (resizeHandle) {
          case 'se': // 右下
            newWidth = Math.max(minWidth, dragStart.initialWidth + deltaX)
            newHeight = Math.max(minHeight, dragStart.initialHeight + deltaY)
            break
          case 'sw': // 左下
            const swWidth = Math.max(minWidth, dragStart.initialWidth - deltaX)
            newWidth = swWidth
            newHeight = Math.max(minHeight, dragStart.initialHeight + deltaY)
            newX = dragStart.containerX + (dragStart.initialWidth - swWidth)
            break
          case 'ne': // 右上
            const neHeight = Math.max(minHeight, dragStart.initialHeight - deltaY)
            newWidth = Math.max(minWidth, dragStart.initialWidth + deltaX)
            newHeight = neHeight
            newY = dragStart.containerY + (dragStart.initialHeight - neHeight)
            break
          case 'nw': // 左上
            const nwWidth = Math.max(minWidth, dragStart.initialWidth - deltaX)
            const nwHeight = Math.max(minHeight, dragStart.initialHeight - deltaY)
            newWidth = nwWidth
            newHeight = nwHeight
            newX = dragStart.containerX + (dragStart.initialWidth - nwWidth)
            newY = dragStart.containerY + (dragStart.initialHeight - nwHeight)
            break
          case 'e': // 右
            newWidth = Math.max(minWidth, dragStart.initialWidth + deltaX)
            break
          case 'w': // 左
            const wWidth = Math.max(minWidth, dragStart.initialWidth - deltaX)
            newWidth = wWidth
            newX = dragStart.containerX + (dragStart.initialWidth - wWidth)
            break
          case 'n': // 上
            const nHeight = Math.max(minHeight, dragStart.initialHeight - deltaY)
            newHeight = nHeight
            newY = dragStart.containerY + (dragStart.initialHeight - nHeight)
            break
          case 's': // 下
            newHeight = Math.max(minHeight, dragStart.initialHeight + deltaY)
            break
        }

        const newDimensions = { width: newWidth, height: newHeight, x: newX, y: newY }
        onSizeChange?.(id, newWidth, newHeight)
        onPositionChange?.(id, newX, newY)
        return newDimensions
      })
    }
  }, [isDragging, isResizing, dragStart, resizeHandle, minWidth, minHeight, id, onPositionChange, onSizeChange])

  // マウス終了処理
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }, [])

  // イベントリスナー設定
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const containerStyle = {
    position: 'absolute' as const,
    left: dimensions.x,
    top: dimensions.y,
    width: dimensions.width,
    height: dimensions.height,
    cursor: isDragging ? 'grabbing' : 'default'
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`resizable-container bg-white border-2 border-gray-300 rounded-xl shadow-lg ${
        isDragging || isResizing ? 'shadow-xl border-blue-400' : ''
      }`}
    >
      {/* ヘッダー（ドラッグハンドル） */}
      <div 
        className="drag-handle bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-xl cursor-grab select-none"
        onMouseDown={handleDragStart}
      >
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4 overflow-auto" style={{ height: 'calc(100% - 57px)' }}>
        {children}
      </div>

      {/* リサイズハンドル */}
      {/* 角のハンドル */}
      <div
        className="resize-handle absolute top-0 left-0 w-4 h-4 bg-blue-400 cursor-nw-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('nw')}
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="resize-handle absolute top-0 right-0 w-4 h-4 bg-blue-400 cursor-ne-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('ne')}
        style={{ transform: 'translate(50%, -50%)' }}
      />
      <div
        className="resize-handle absolute bottom-0 left-0 w-4 h-4 bg-blue-400 cursor-sw-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('sw')}
        style={{ transform: 'translate(-50%, 50%)' }}
      />
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-blue-400 cursor-se-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('se')}
        style={{ transform: 'translate(50%, 50%)' }}
      />

      {/* 辺のハンドル */}
      <div
        className="resize-handle absolute top-0 left-1/2 w-12 h-3 bg-blue-400 cursor-n-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('n')}
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="resize-handle absolute bottom-0 left-1/2 w-12 h-3 bg-blue-400 cursor-s-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('s')}
        style={{ transform: 'translate(-50%, 50%)' }}
      />
      <div
        className="resize-handle absolute left-0 top-1/2 w-3 h-12 bg-blue-400 cursor-w-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('w')}
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      <div
        className="resize-handle absolute right-0 top-1/2 w-3 h-12 bg-blue-400 cursor-e-resize opacity-0 hover:opacity-80 transition-opacity"
        onMouseDown={handleResizeStart('e')}
        style={{ transform: 'translate(50%, -50%)' }}
      />
    </div>
  )
}