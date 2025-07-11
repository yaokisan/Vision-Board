import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  className?: string
}

export default function TaskCard({ task, className = '' }: TaskCardProps) {
  return (
    <div className={`card-base relative w-56 ${className}`}>
      <div className="gradient-bar" />
      
      <div className="text-center">
        <h3 className="text-base font-bold mb-1">{task.name}</h3>
        <p className="text-sm text-gray-700">責任者: {task.responsible_person}</p>
      </div>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-top" />
      <div className="connection-dot connection-dot-bottom" />
    </div>
  )
}