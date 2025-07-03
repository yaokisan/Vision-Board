'use client'

import { useEffect, useState } from 'react'

interface ConnectionLineProps {
  startElementId: string
  endElementId: string
  color?: string
  strokeWidth?: number
  animated?: boolean
}

export default function ConnectionLine({ 
  startElementId, 
  endElementId, 
  color = '#4c6ef5',
  strokeWidth = 3,
  animated = true
}: ConnectionLineProps) {
  const [pathData, setPathData] = useState('')

  useEffect(() => {
    const updatePath = () => {
      const startElement = document.getElementById(startElementId)
      const endElement = document.getElementById(endElementId)
      
      if (!startElement || !endElement) {
        console.log(`Elements not found: ${startElementId}=${!!startElement}, ${endElementId}=${!!endElement}`)
        setPathData('')
        return
      }

      // SVGコンテナ（.relative）を基準にする
      const svgContainer = startElement.closest('.relative') as HTMLElement
      if (!svgContainer) {
        console.log('SVG container (.relative) not found')
        setPathData('')
        return
      }

      // 要素とSVGコンテナのビューポート座標を取得
      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()
      const svgRect = svgContainer.getBoundingClientRect()
      
      // SVGコンテナを基準とした相対座標（シンプルな計算）
      const startX = startRect.left + startRect.width / 2 - svgRect.left
      const startY = startRect.top + startRect.height / 2 - svgRect.top
      const endX = endRect.left + endRect.width / 2 - svgRect.left
      const endY = endRect.top + endRect.height / 2 - svgRect.top

      // 直線パスを作成
      const path = `M ${startX} ${startY} L ${endX} ${endY}`
      setPathData(path)
    }

    // 初期描画（遅延実行で要素が確実に存在するまで待つ）
    const timer = setTimeout(updatePath, 500)
    
    // DOM要素の監視
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updatePath)
    })
    
    // キャンバスコンテナのみを監視
    const canvasContainer = document.querySelector('[style*="transform"]')
    if (canvasContainer) {
      observer.observe(canvasContainer, { 
        attributes: true, 
        attributeFilter: ['style'],
        subtree: true
      })
    }
    
    // イベントリスナー
    window.addEventListener('resize', updatePath)
    
    // 定期的な更新
    const interval = setInterval(updatePath, 100)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('resize', updatePath)
      observer.disconnect()
    }
  }, [startElementId, endElementId])

  if (!pathData) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={animated ? "8,4" : undefined}
        className={animated ? "animate-dash" : ""}
        opacity="0.8"
      />
    </svg>
  )
}