import { Position } from '@/types'

interface PositionCardProps {
  position: Position
  className?: string
}

export default function PositionCard({ position, className = '' }: PositionCardProps) {
  return (
    <div className={`card-base relative ${className}`}>
      <div className="gradient-bar" />
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">{position.person_name}</h3>
          <p className="text-sm text-gray-500">{position.name}</p>
        </div>
        <div className="avatar">
          {position.person_name.charAt(0)}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="info-label">📧 メールアドレス</p>
          <p className="info-value">{position.person_name.toLowerCase().replace(' ', '.')}@example.com</p>
        </div>
        
        <div>
          <p className="info-label">🎯 役割</p>
          <p className="info-value">経営管理</p>
        </div>
      </div>
      
      <button className="btn-primary w-full mt-6">
        → プロフィールを見る
      </button>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-top" />
      <div className="connection-dot connection-dot-bottom" />
    </div>
  )
}