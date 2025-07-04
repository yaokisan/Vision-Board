'use client'

import { useEffect, useState } from 'react'

interface ConnectionLineProps {
  startElementId: string
  endElementId: string
  color?: string
  strokeWidth?: number
  animated?: boolean
  forceUpdate?: number // 強制更新用
}

export default function ConnectionLine({ 
  startElementId, 
  endElementId, 
  color = '#4c6ef5',
  strokeWidth = 3,
  animated = true,
  forceUpdate
}: ConnectionLineProps) {
  const [pathData, setPathData] = useState('')

  useEffect(() => {
    const updatePath = () => {
      // 基本の座標計算に戻す（デバッグログ削除）
      const startElement = document.getElementById(startElementId)
      const endElement = document.getElementById(endElementId)
      
      if (!startElement || !endElement) {
        setPathData('')
        return
      }

      // Transform要素を基準とした座標計算
      const transformedCanvas = document.querySelector('[style*="transform"]') as HTMLElement
      if (!transformedCanvas) {
        setPathData('')
        return
      }
      
      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()
      const transformRect = transformedCanvas.getBoundingClientRect()
      
      // Transform要素を基準とした相対座標
      const startX = startRect.left + startRect.width / 2 - transformRect.left
      const startY = startRect.top + startRect.height / 2 - transformRect.top
      const endX = endRect.left + endRect.width / 2 - transformRect.left
      const endY = endRect.top + endRect.height / 2 - transformRect.top

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
    
    // 個別カード要素のみを監視
    const startElement = document.getElementById(startElementId)
    const endElement = document.getElementById(endElementId)
    
    if (startElement) {
      observer.observe(startElement, {
        attributes: true,
        attributeFilter: ['style'],
        subtree: true,
        childList: true
      })
    }
    
    if (endElement) {
      observer.observe(endElement, {
        attributes: true,
        attributeFilter: ['style'], 
        subtree: true,
        childList: true
      })
    }
    
    // イベントリスナー
    window.addEventListener('resize', updatePath)
    
    // より頻繁な更新（カード移動検知のため）
    const interval = setInterval(updatePath, 50)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      window.removeEventListener('resize', updatePath)
      observer.disconnect()
    }
  }, [startElementId, endElementId, forceUpdate])

  if (!pathData) return null

  return (
    <path
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={animated ? "8,4" : undefined}
      className={animated ? "animate-dash" : ""}
      opacity="0.8"
    />
  )
}