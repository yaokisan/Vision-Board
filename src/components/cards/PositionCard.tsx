import { Position } from '@/types'

interface PositionCardProps {
  position: Position
  className?: string
}

export default function PositionCard({ position, className = '' }: PositionCardProps) {
  const getIcon = () => {
    return position.name === 'CEO' ? '👤' : '👥'
  }

  return (
    <div className={`card-base ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{getIcon()}</span>
        <span className="text-sm text-gray-500 font-medium">{position.name}</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800">{position.person_name}</h3>
    </div>
  )
}