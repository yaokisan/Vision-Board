import { Business } from '@/types'

interface BusinessCardProps {
  business: Business
  className?: string
}

export default function BusinessCard({ business, className = '' }: BusinessCardProps) {
  return (
    <div className={`card-base relative w-64 ${className}`}>
      <div className="gradient-bar" />
      
      <div className="text-center">
        <h3 className="text-lg font-bold mb-2">{business.name}</h3>
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">目標:</span> {business.goal}
        </p>
        <div className="border-2 border-red-400 rounded bg-red-50 px-3 py-1 inline-block">
          <p className="text-sm font-medium text-red-700">
            事業責任者: {business.responsible_person}
          </p>
        </div>
      </div>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-top" />
      <div className="connection-dot connection-dot-bottom" />
    </div>
  )
}