'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useEffect } from 'react'
import { CardType } from '@/types'

interface DraggableCardProps {
  id: string
  type: CardType
  children: React.ReactNode
  className?: string
  persistedPosition?: { x: number; y: number }
}

export default function DraggableCard({ id, type, children, className = '', persistedPosition }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type }
  })

  // 常に永続化位置 + ドラッグ変位の合計を表示（状態に関係なく）
  const baseX = persistedPosition?.x || 0
  const baseY = persistedPosition?.y || 0
  const deltaX = transform?.x || 0
  const deltaY = transform?.y || 0
  
  const finalTransform = `translate3d(${baseX + deltaX}px, ${baseY + deltaY}px, 0)`
  
  const style: React.CSSProperties = {
    transform: finalTransform,
    transition: 'none',
    opacity: 1,
    visibility: 'visible',
  }


  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'card-dragging' : ''} cursor-grab active:cursor-grabbing`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}