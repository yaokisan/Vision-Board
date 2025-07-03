import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  className?: string
}

export default function TaskCard({ task, className = '' }: TaskCardProps) {
  return (
    <div className={`card-base ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💼</span>
        <span className="text-sm text-gray-500 font-medium">業務</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{task.name}</h3>
      <p className="text-sm text-gray-600 mb-3">
        <span className="font-medium">目標:</span> {task.goal}
      </p>
      <div className="bg-task-orange text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
        🎯 責任者: {task.responsible_person}
      </div>
      {task.group_name && (
        <div className="mt-2 text-xs text-gray-500">
          グループ: {task.group_name}
        </div>
      )}
    </div>
  )
}