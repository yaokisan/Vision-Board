'use client'

import { useDroppable } from '@dnd-kit/core'
import { CardType } from '@/types'

interface DropZoneProps {
  id: string
  acceptTypes: CardType[]
  children: React.ReactNode
  className?: string
}

export default function DropZone({ id, acceptTypes, children, className = '' }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { acceptTypes }
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'drop-zone-active' : ''} transition-all duration-200`}
    >
      {children}
    </div>
  )
}