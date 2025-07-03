import { Executor } from '@/types'

interface ExecutorCardProps {
  executor: Executor
  className?: string
}

export default function ExecutorCard({ executor, className = '' }: ExecutorCardProps) {
  return (
    <div className={`card-base ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">⚡</span>
        <span className="text-sm text-gray-500 font-medium">実行者</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{executor.name}</h3>
      <div className="bg-executor-blue text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
        {executor.role}
      </div>
    </div>
  )
}