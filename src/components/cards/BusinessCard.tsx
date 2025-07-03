import { Business } from '@/types'

interface BusinessCardProps {
  business: Business
  className?: string
}

export default function BusinessCard({ business, className = '' }: BusinessCardProps) {
  return (
    <div className={`card-base ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🚀</span>
        <span className="text-sm text-gray-500 font-medium">事業</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{business.name}</h3>
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">目標:</span> {business.goal}
      </p>
      <div className="bg-business-gold text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
        👑 責任者: {business.responsible_person}
      </div>
      {business.category && (
        <div className="mt-2 text-xs text-gray-500">
          カテゴリー: {business.category}
        </div>
      )}
    </div>
  )
}