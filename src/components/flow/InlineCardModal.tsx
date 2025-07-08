'use client'

import { useState, useEffect } from 'react'
import { NodeType } from '@/types/flow'
import { MemberSelector } from './MemberSelector'
import { supabase } from '@/lib/supabase/client'

interface InlineCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateCard: (cardType: string, data: any) => void
  position: { x: number; y: number }
  parentId?: string
  currentUser: any
}

export default function InlineCardModal({ 
  isOpen, 
  onClose, 
  onCreateCard, 
  position,
  parentId,
  currentUser 
}: InlineCardModalProps) {
  const [selectedCardType, setSelectedCardType] = useState<string | null>(null)
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
    color: 'green',
    business_id: null as string | null // business_id統合用
  })
  
  const [members, setMembers] = useState<any[]>([])
  
  // メンバーデータを取得
  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentUser?.company_id) return
      
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email')
        .eq('company_id', currentUser.company_id)
        .order('name')
      
      if (error) {
        console.error('Failed to fetch members:', error)
        return
      }
      
      setMembers(data || [])
    }
    
    if (isOpen && currentUser?.company_id) {
      fetchMembers()
    }
  }, [isOpen, currentUser?.company_id])

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
      member_id: null,
      goal: '',
      responsible_person: '',
      responsible_person_id: null,
      role: '',
      title: '',
      description: '',
      color: 'green',
      business_id: null
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
                placeholder="担当者を選択"
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
                placeholder="責任者を選択"
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
                placeholder="責任者を選択"
              />
            </div>
          </>
        )
      case 'executor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">実行者</label>
              <MemberSelector
                members={members}
                selectedMemberId={formData.member_id}
                onSelect={(memberId) => {
                  const selectedMember = members.find(m => m.id === memberId)
                  setFormData({ 
                    ...formData, 
                    member_id: memberId,
                    name: selectedMember?.name || ''
                  })
                }}
                placeholder="実行者を選択"
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