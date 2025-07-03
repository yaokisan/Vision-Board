import { Executor } from '@/types'

interface ExecutorCardProps {
  executor: Executor
  className?: string
}

export default function ExecutorCard({ executor, className = '' }: ExecutorCardProps) {
  return (
    <div className={`card-base relative w-48 ${className}`}>
      <div className="gradient-bar" />
      
      <div className="text-center">
        <p className="text-sm font-medium mb-1">{executor.role}</p>
        <p className="text-base">{executor.name}</p>
      </div>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-top" />
    </div>
  )
}