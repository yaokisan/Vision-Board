interface CxoCardProps {
  title: string
  name: string
  className?: string
}

export default function CxoCard({ title, name, className = '' }: CxoCardProps) {
  return (
    <div className={`card-base relative w-56 ${className}`}>
      <div className="gradient-bar" />
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-lg font-medium">{name}</p>
      </div>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-top" />
      <div className="connection-dot connection-dot-bottom" />
    </div>
  )
}