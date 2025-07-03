'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ZoomPanCanvasProps {
  children: React.ReactNode
}

interface ViewState {
  zoom: number
  panX: number
  panY: number
}

export default function ZoomPanCanvas({ children }: ZoomPanCanvasProps) {
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    panX: 0,
    panY: 0
  })
  
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // ズーム機能（Command + ホイール）
  const handleWheel = useCallback((e: WheelEvent) => {
    // Command+ホイール: ズーム
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(3, viewState.zoom * zoomFactor))
      
      // マウス位置を中心にズーム
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        const zoomPoint = {
          x: (mouseX - viewState.panX) / viewState.zoom,
          y: (mouseY - viewState.panY) / viewState.zoom
        }
        
        setViewState(prev => ({
          zoom: newZoom,
          panX: mouseX - zoomPoint.x * newZoom,
          panY: mouseY - zoomPoint.y * newZoom
        }))
      }
    }
    // Shift+ホイール: 左右移動
    else if (e.shiftKey) {
      e.preventDefault()
      setViewState(prev => ({
        ...prev,
        panX: prev.panX - e.deltaY
      }))
    }
    // 通常のホイール: 上下移動
    else {
      e.preventDefault()
      setViewState(prev => ({
        ...prev,
        panY: prev.panY - e.deltaY
      }))
    }
  }, [viewState])

  // 右クリックドラッグでパン
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) { // 右クリック
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setViewState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // イベントリスナーの設定
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // 右クリックメニューを無効化
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // キャンバスのスタイル
  const canvasStyle = {
    transform: `translate(${viewState.panX}px, ${viewState.panY}px) scale(${viewState.zoom})`,
    transformOrigin: '0 0',
    transition: isPanning ? 'none' : 'transform 0.1s ease-out'
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      {/* ズーム・パン情報表示 */}
      <div className="absolute top-4 left-4 z-50 bg-white rounded-lg shadow-md px-3 py-2 text-sm">
        <div>ズーム: {Math.round(viewState.zoom * 100)}%</div>
        <div className="text-xs text-gray-500 mt-1">
          Cmd+ホイール: ズーム | Shift+ホイール: 左右移動 | 右クリック+ドラッグ: パン
        </div>
      </div>

      {/* メインキャンバス */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={isPanning ? { cursor: 'grabbing' } : { cursor: 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        <div style={canvasStyle} className="relative">
          {children}
        </div>
      </div>

      {/* ズームコントロール */}
      <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(3, prev.zoom * 1.2) }))}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          +
        </button>
        <button
          onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
        >
          −
        </button>
        <button
          onClick={() => setViewState({ zoom: 1, panX: 0, panY: 0 })}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 text-xs"
        >
          🏠
        </button>
      </div>
    </div>
  )
}