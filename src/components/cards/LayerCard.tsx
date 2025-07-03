import { Layer } from '@/types'

interface LayerCardProps {
  layer: Layer
  className?: string
  children?: React.ReactNode
}

export default function LayerCard({ layer, className = '', children }: LayerCardProps) {
  const getBackgroundColor = () => {
    return layer.type === 'business' ? 'bg-green-50' : 'bg-blue-50'
  }

  return (
    <div className={`${getBackgroundColor()} border-2 border-gray-300 rounded-xl p-6 min-h-[400px] ${className}`}>
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
        【{layer.name}レイヤー】
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}