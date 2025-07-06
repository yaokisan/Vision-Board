'use client'

import { useState, useEffect } from 'react'
import { NodeType } from '@/types/flow'
import { Member } from '@/types'
import { MemberSelector } from './MemberSelector'

interface EditNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updatedData: any) => void
  nodeData: { id: string; type: string; data: any } | null
  members: Member[]
  currentUser: Member
  businesses?: any[] // 事業リストを追加
}

export default function EditNodeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  nodeData,
  members,
  currentUser,
  businesses = []
}: EditNodeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    person_name: '',
    member_id: null as string | null,
    goal: '',
    responsible_person: '',
    responsible_person_id: null as string | null,
    role: '',
    title: '',
    description: '',
    type: '',
    color: '',
    attribute: 'company'
  })

  useEffect(() => {
    if (nodeData?.data) {
      const data = nodeData.data
      const entity = data.entity || {}
      setFormData({
        name: entity.name || data.ceoName || data.label || '',
        person_name: entity.person_name || '',
        member_id: entity.member_id || null,
        goal: entity.goal || '',
        responsible_person: entity.responsible_person || '',
        responsible_person_id: entity.responsible_person_id || null,
        role: entity.role || '',
        title: entity.title || '',
        description: data.description || entity.description || '',
        type: data.type || entity.type || '',
        color: data.color || entity.color || '',
        attribute: (() => {
          const attributeValue = data.attribute || entity.attribute || 'company'
          // 有効な値かチェック（会社または実際の事業ID）
          const validValues = ['company', ...businesses.map(b => b.id)]
          return validValues.includes(attributeValue) ? attributeValue : 'company'
        })()
      })
    }
  }, [nodeData, businesses])

  if (!isOpen || !nodeData) return null

  // 利用可能な事業リストを取得
  const getAvailableBusinesses = () => {
    // テスト環境でのモック対応
    if (typeof global !== 'undefined' && (global as any).getBusinesses) {
      return (global as any).getBusinesses()
    }
    
    // propsから渡された実際の事業データを使用
    return businesses.map(business => ({
      id: business.id,
      name: business.name
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(nodeData.id, formData)
    onClose()
  }

  const getNodeTypeName = () => {
    const nodeType = nodeData.data.entity.type || 'unknown'
    switch (nodeType) {
      case 'company': return '会社'
      case 'cxo': return 'CXO'
      case 'business': return '事業'
      case 'task': return '業務'
      case 'executor': return '実行者'
      default: return 'ノード'
    }
  }

  const renderFormFields = () => {
    const entity = nodeData.data.entity
    const nodeType = nodeData.type
    
    // ノードタイプに基づいて適切なフォームを表示
    switch (nodeType) {
      case NodeType.CXO:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">役職名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: CTO, CFO"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
              <MemberSelector
                members={members}
                selectedMemberId={formData.member_id}
                onSelect={(memberId) => {
                  const selectedMember = members.find(m => m.id === memberId)
                  setFormData({ 
                    ...formData, 
                    member_id: memberId,
                    person_name: selectedMember?.name || ''
                  })
                }}
                placeholder="担当者を選択..."
                searchable={true}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                この役職を担当するメンバーを選択してください
              </p>
            </div>
          </>
        )
      
      case NodeType.BUSINESS:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">事業名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: Webサービス事業"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目標</label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 売上1億円"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">責任者</label>
              <MemberSelector
                members={members}
                selectedMemberId={formData.responsible_person_id}
                onSelect={(memberId) => {
                  const selectedMember = members.find(m => m.id === memberId)
                  setFormData({ 
                    ...formData, 
                    responsible_person_id: memberId,
                    responsible_person: selectedMember?.name || ''
                  })
                }}
                placeholder="責任者を選択..."
                searchable={true}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                この事業の責任者を選択してください
              </p>
            </div>
          </>
        )
      
      case NodeType.TASK:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">業務名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: マーケティング業務"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目標</label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 月間リード100件獲得"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">責任者</label>
              <MemberSelector
                members={members}
                selectedMemberId={formData.responsible_person_id}
                onSelect={(memberId) => {
                  const selectedMember = members.find(m => m.id === memberId)
                  setFormData({ 
                    ...formData, 
                    responsible_person_id: memberId,
                    responsible_person: selectedMember?.name || ''
                  })
                }}
                placeholder="責任者を選択..."
                searchable={true}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                この業務の責任者を選択してください
              </p>
            </div>
          </>
        )
      
      case NodeType.EXECUTOR:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: デザイナー"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">実行者名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 鈴木次郎"
                required
              />
            </div>
          </>
        )
      
      case NodeType.BUSINESS_LAYER:
      case NodeType.CXO_LAYER:
        const availableBusinesses = getAvailableBusinesses()
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コンテナタイトル</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 開発部門、経営レイヤー"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明文</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 開発・技術・エンジニアリングエリア"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">属性</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="attribute"
                    value="company"
                    checked={formData.attribute === 'company'}
                    onChange={(e) => setFormData({ ...formData, attribute: e.target.value })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">会社</span>
                </label>
                {availableBusinesses.map((business: { id: string; name: string }) => (
                  <label key={business.id} className="flex items-center">
                    <input
                      type="radio"
                      name="attribute"
                      value={business.id}
                      checked={formData.attribute === business.id}
                      onChange={(e) => setFormData({ ...formData, attribute: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{business.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                このノードの所属属性を選択してください
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">コンテナ色</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'gray', name: 'グレー', bg: 'bg-gray-400', border: 'border-gray-400' },
                  { value: 'blue', name: 'ブルー', bg: 'bg-blue-400', border: 'border-blue-400' },
                  { value: 'green', name: 'グリーン', bg: 'bg-green-400', border: 'border-green-400' },
                  { value: 'purple', name: 'パープル', bg: 'bg-purple-400', border: 'border-purple-400' },
                  { value: 'red', name: 'レッド', bg: 'bg-red-400', border: 'border-red-400' },
                  { value: 'yellow', name: 'イエロー', bg: 'bg-yellow-400', border: 'border-yellow-400' },
                  { value: 'indigo', name: 'インディゴ', bg: 'bg-indigo-400', border: 'border-indigo-400' },
                  { value: 'pink', name: 'ピンク', bg: 'bg-pink-400', border: 'border-pink-400' }
                ].map((colorOption) => {
                  const isSelected = (formData.color || (nodeData.type === NodeType.CXO_LAYER ? 'purple' : 'gray')) === colorOption.value
                  return (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all duration-200
                        ${colorOption.bg}
                        ${isSelected 
                          ? `${colorOption.border} shadow-lg scale-105` 
                          : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                        }
                      `}
                      title={colorOption.name}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                コンテナの背景色を選択してください
              </p>
            </div>
          </>
        )
      
      default:
        // 従来の会社カードなど
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {getNodeTypeName()}を編集
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}