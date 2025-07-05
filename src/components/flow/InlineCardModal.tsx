'use client'

import { useState } from 'react'
import { NodeType } from '@/types/flow'

interface InlineCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateCard: (cardType: string, data: any) => void
  position: { x: number; y: number }
  parentId?: string
}

export default function InlineCardModal({ 
  isOpen, 
  onClose, 
  onCreateCard, 
  position,
  parentId 
}: InlineCardModalProps) {
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    person_name: '',
    goal: '',
    responsible_person: '',
    role: '',
    title: '',
    description: '',
    color: 'green'
  })

  if (!isOpen) return null

  const cardTypes = [
    { type: 'cxo', label: 'CXOカード', description: '経営陣・役職者', color: 'bg-purple-100 border-purple-300' },
    { type: 'business', label: '事業カード', description: '事業部門', color: 'bg-green-100 border-green-300' },
    { type: 'task', label: '業務カード', description: 'プロダクト開発など', color: 'bg-orange-100 border-orange-300' },
    { type: 'executor', label: '実行者カード', description: '役割と書かれたカード', color: 'bg-blue-100 border-blue-300' },
    { type: 'container', label: 'コンテナ', description: 'レイヤーコンテナ', color: 'bg-gray-100 border-gray-300' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCardType) return

    const cardData = {
      id: `${selectedCardType}-${Date.now()}`,
      type: selectedCardType,
      ...formData,
      parentId
    }

    onCreateCard(selectedCardType, cardData)
    onClose()
    setSelectedCardType(null)
    setFormData({
      name: '',
      person_name: '',
      goal: '',
      responsible_person: '',
      role: '',
      title: '',
      description: '',
      color: 'green'
    })
  }

  const renderFormFields = () => {
    if (!selectedCardType) return null

    switch (selectedCardType) {
      case 'cxo':
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
              <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
              <input
                type="text"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 田中太郎"
                required
              />
            </div>
          </>
        )
      case 'business':
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
                placeholder="例: ユーザー数100万人達成"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">責任者</label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 佐藤花子"
                required
              />
            </div>
          </>
        )
      case 'task':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">業務名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: プロダクト開発"
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
                placeholder="例: 新機能リリース"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">責任者</label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 山田太郎"
                required
              />
            </div>
          </>
        )
      case 'executor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 開発者A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">役割</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: フロントエンド開発"
                required
              />
            </div>
          </>
        )
      case 'container':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 新レイヤー"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">詳細名</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 研究開発エリア"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">色</label>
              <select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              >
                <option value="green">緑（事業系）</option>
                <option value="blue">青（経営系）</option>
                <option value="purple">紫（CXO系）</option>
                <option value="orange">オレンジ（プロジェクト系）</option>
                <option value="red">赤（重要系）</option>
              </select>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div 
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50"
      style={{ 
        left: position.x, 
        top: position.y,
        maxWidth: '300px',
        minWidth: '280px'
      }}
    >
      {!selectedCardType ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-800 mb-3">カードタイプを選択</h3>
          {cardTypes.map((cardType) => (
            <button
              key={cardType.type}
              onClick={() => setSelectedCardType(cardType.type)}
              className={`w-full text-left p-2 border rounded-md hover:bg-gray-50 transition-colors ${cardType.color}`}
            >
              <div className="font-medium text-gray-800 text-sm">{cardType.label}</div>
              <div className="text-xs text-gray-600">{cardType.description}</div>
            </button>
          ))}
          <button
            onClick={onClose}
            className="w-full mt-2 px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">
              {cardTypes.find(t => t.type === selectedCardType)?.label} を作成
            </h3>
            <button
              type="button"
              onClick={() => setSelectedCardType(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← 戻る
            </button>
          </div>
          
          {renderFormFields()}
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              作成
            </button>
          </div>
        </form>
      )}
    </div>
  )
}