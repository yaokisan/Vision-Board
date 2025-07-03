import { Company } from '@/types'

interface CompanyCardProps {
  company: Company
  className?: string
}

export default function CompanyCard({ company, className = '' }: CompanyCardProps) {
  return (
    <div className={`card-base ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🏢</span>
        <span className="text-sm text-gray-500 font-medium">会社</span>
      </div>
      <h3 className="text-lg font-bold text-gray-800">{company.name}</h3>
    </div>
  )
}