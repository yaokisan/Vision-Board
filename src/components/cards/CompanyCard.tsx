import { Company } from '@/types'

interface CompanyCardProps {
  company: Company
  ceoName?: string
  className?: string
}

export default function CompanyCard({ company, ceoName = '田中太郎', className = '' }: CompanyCardProps) {
  return (
    <div className={`card-base relative w-80 ${className}`}>
      <div className="gradient-bar" />
      <div className="text-center">
        <h2 className="text-xl font-bold mb-3">{company.name}</h2>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">CEO</p>
          <p className="text-lg font-medium">{ceoName}</p>
        </div>
      </div>
      
      {/* Connection dots */}
      <div className="connection-dot connection-dot-bottom" />
    </div>
  )
}