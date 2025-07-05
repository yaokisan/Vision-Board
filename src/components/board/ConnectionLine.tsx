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
  const [lastScale, setLastScale] = useState(1) // スケール変化検知用

  // 追加: コンテナのscale値を取得するユーティリティ関数
  const getScale = (el: HTMLElement): number => {
    const style = window.getComputedStyle(el)
    const transform = style.transform
    if (!transform || transform === 'none') return 1

    // matrix(a, b, c, d, e, f) の a が scaleX を表す
    const matrixMatch = transform.match(/matrix\(([^,]+),[^,]+,[^,]+,[^,]+,[^,]+,[^,]+\)/)
    if (matrixMatch) return parseFloat(matrixMatch[1]) || 1

    // matrix3d の場合、1番目の値が scaleX
    const matrix3dMatch = transform.match(/matrix3d\(([^,]+),/)
    if (matrix3dMatch) return parseFloat(matrix3dMatch[1]) || 1

    // scale(1.2) の書式
    const scaleMatch = transform.match(/scale\(([^)]+)\)/)
    if (scaleMatch) return parseFloat(scaleMatch[1]) || 1

    return 1
  }

  useEffect(() => {
    const updatePath = () => {
      const startElement = document.getElementById(startElementId)
      const endElement = document.getElementById(endElementId)
      
      if (!startElement || !endElement) {
        setPathData('')
        return
      }

      // シンプル：カードと同じ座標系での絶対位置
      const startRect = startElement.getBoundingClientRect()
      const endRect = endElement.getBoundingClientRect()
      
      // transform を実際に持つコンテナを探索
      let transformContainer: HTMLElement | null = startElement as HTMLElement
      while (transformContainer && getScale(transformContainer) === 1) {
        transformContainer = transformContainer.parentElement
      }

      // 見つからなければ従来の relative を fallback
      if (!transformContainer) {
        transformContainer = startElement.closest('.relative') as HTMLElement | null
      }

      if (!transformContainer) {
        setPathData('')
        return
      }

      const containerRect = transformContainer.getBoundingClientRect()

      // コンテナのスケールを取得
      const scale = getScale(transformContainer)
      
      // スケールが変わった時だけログ出力
      if (scale !== lastScale) {
        console.log('⚡ SCALE CHANGED →', scale)
        console.log('matrix =', window.getComputedStyle(transformContainer).transform)
        console.log('containerRect =', { left: containerRect.left, top: containerRect.top })
        console.log('calculated coords =', { startX: (startRect.left + startRect.width / 2 - containerRect.left) / scale, startY: (startRect.top + startRect.height - containerRect.top) / scale, endX: (endRect.left + endRect.width / 2 - containerRect.left) / scale, endY: (endRect.top - containerRect.top) / scale })
        setLastScale(scale)
      }

      // カードと同じ座標系での相対座標（スケールを打ち消すために除算）
      const startX = (startRect.left + startRect.width / 2 - containerRect.left) / scale
      const startY = (startRect.top + startRect.height - containerRect.top) / scale
      const endX = (endRect.left + endRect.width / 2 - containerRect.left) / scale
      const endY = (endRect.top - containerRect.top) / scale

      // デバッグ: 計算された座標をコンソールに出力
      // console.log(`🎯 Connection: ${startElementId} -> ${endElementId}`)
      // console.log(`📍 Start card rect:`, { x: startRect.x, y: startRect.y, w: startRect.width, h: startRect.height })
      // console.log(`📍 End card rect:`, { x: endRect.x, y: endRect.y, w: endRect.width, h: endRect.height })
      // console.log(`📍 Transform container rect:`, { x: containerRect.x, y: containerRect.y, w: containerRect.width, h: containerRect.height })
      // console.log(`🎯 Calculated coords:`, { startX, startY, endX, endY })
      
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
    <>
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={animated ? "8,4" : undefined}
        className={animated ? "animate-dash" : ""}
        opacity="0.8"
      />
      {/* デバッグ用: 計算された座標位置に点を表示 */}
      {pathData && (
        <>
          {/* 開始点 */}
          <circle
            cx={pathData.split(' ')[1]}
            cy={pathData.split(' ')[2]}
            r="4"
            fill="red"
            opacity="0.8"
          />
          {/* 終了点 */}
          <circle
            cx={pathData.split(' ')[4]}
            cy={pathData.split(' ')[5]}
            r="4"
            fill="blue"
            opacity="0.8"
          />
        </>
      )}
    </>
  )
}