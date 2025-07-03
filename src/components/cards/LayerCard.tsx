import { Layer } from '@/types'

interface LayerCardProps {
  layer: Layer
  className?: string
  children?: React.ReactNode
}

export default function LayerCard({ layer, className = '', children }: LayerCardProps) {
  const getBackgroundColor = () => {
    return layer.type === 'business' ? 'bg-business-green' : 'bg-management-teal'
  }

  return (
    <div className={`${getBackgroundColor()} rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📋</span>
        <h2 className="text-xl font-bold text-gray-800">{layer.name}レイヤー</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}