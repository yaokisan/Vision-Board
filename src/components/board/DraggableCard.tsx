'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { CardType } from '@/types'

interface DraggableCardProps {
  id: string
  type: CardType
  children: React.ReactNode
  className?: string
}

export default function DraggableCard({ id, type, children, className = '' }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
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