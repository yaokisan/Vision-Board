import { useState } from 'react'
import { Company, Member } from '@/types'
import { MemberSelector } from '../flow/MemberSelector'

interface CompanyCardProps {
  company: Company
  ceoName?: string
  className?: string
  members?: Member[]
  currentUser?: Member
  editable?: boolean
  onEdit?: () => void
  onUpdate?: (data: { companyName: string; ceoId: string }) => void
}

export default function CompanyCard({ 
  company, 
  ceoName = '田中太郎', 
  className = '',
  members = [],
  currentUser,
  editable = false,
  onEdit,
  onUpdate
}: CompanyCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editCompanyName, setEditCompanyName] = useState(company.name)
  const [editCeoId, setEditCeoId] = useState('')
  const [errors, setErrors] = useState<{ companyName?: string }>({})

  const handleEdit = () => {
    setEditCompanyName(company.name)
    setEditCeoId('')
    setErrors({})
    setIsEditModalOpen(true)
    onEdit?.()
  }

  const handleCancel = () => {
    setIsEditModalOpen(false)
    setErrors({})
  }

  const handleSave = () => {
    const newErrors: { companyName?: string } = {}

    if (!editCompanyName.trim()) {
      newErrors.companyName = '会社名は必須です'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onUpdate?.({
      companyName: editCompanyName,
      ceoId: editCeoId || members[0]?.id || ''
    })

    setIsEditModalOpen(false)
    setErrors({})
  }
  return (
    <>
      <div className={`card-base relative w-80 ${className}`}>
        <div className="gradient-bar" />
        
        {/* 編集ボタン */}
        {editable && (
          <button
            data-testid="company-edit-button"
            onClick={handleEdit}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
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

      {/* 編集モーダル */}
      {isEditModalOpen && (
        <div 
          data-testid="company-edit-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">会社情報編集</h3>
            
            {/* 会社名入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会社名
              </label>
              <input
                data-testid="company-name-input"
                type="text"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.companyName && (
                <p data-testid="company-name-error" className="text-red-500 text-sm mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* CEO選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CEO
              </label>
              <div data-testid="ceo-selector">
                <MemberSelector
                  members={members}
                  value={editCeoId}
                  onChange={setEditCeoId}
                  placeholder="CEOを選択してください"
                />
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-2">
              <button
                data-testid="cancel-button"
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                data-testid="save-button"
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}