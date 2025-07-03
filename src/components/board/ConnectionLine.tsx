'use client'

import { useEffect, useRef, useState } from 'react'

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
        console.log(`Elements not found: ${startElementId}, ${endElementId}`)
        return
      }

      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()
      
      // Calculate relative positions
      const startX = startRect.left + startRect.width / 2
      const startY = startRect.bottom
      const endX = endRect.left + endRect.width / 2
      const endY = endRect.top

      // Create simple straight line for now
      const path = `M ${startX} ${startY} L ${endX} ${endY}`
      setPathData(path)
    }

    // 初期描画
    const timer = setTimeout(updatePath, 100)
    
    // リサイズ時の更新
    window.addEventListener('resize', updatePath)
    
    // MutationObserver でDOM要素の位置変更を監視
    const observer = new MutationObserver(() => {
      requestAnimationFrame(updatePath)
    })
    
    const startEl = document.getElementById(startElementId)
    const endEl = document.getElementById(endElementId)
    
    if (startEl) {
      observer.observe(startEl, { 
        attributes: true, 
        attributeFilter: ['style'],
        subtree: true 
      })
    }
    if (endEl) {
      observer.observe(endEl, { 
        attributes: true, 
        attributeFilter: ['style'],
        subtree: true 
      })
    }
    
    // 定期的な更新（フォールバック）
    const interval = setInterval(updatePath, 16) // 60fps
    
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
      className="fixed inset-0 w-full h-full pointer-events-none"
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