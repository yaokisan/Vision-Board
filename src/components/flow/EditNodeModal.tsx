'use client'

import { useState, useEffect } from 'react'
import { NodeType } from '@/types/flow'
import { Member } from '@/types'
import { MemberSelector } from './MemberSelector'
import { NodeDataService } from '@/lib/services/nodeDataService'

interface EditNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updatedData: any) => void
  nodeData: { id: string; type: string; data: any } | null
  members: Member[]
  currentUser: Member
  businesses?: any[] // 事業リストを追加
  tasks?: any[] // 業務リストを追加
}

export default function EditNodeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  nodeData,
  members,
  currentUser,
  businesses = [],
  tasks = []
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
    business_id: null as string | null, // business_id統合用
    task_id: null as string | null,
    needs_migration: false // 実行者の移行フラグ
  })

  useEffect(() => {
    if (nodeData?.data) {
      const data = nodeData.data
      const entity = data.entity || {}
      setFormData({
        name: entity.name || data.ceoName || data.label || '',
        person_name: entity.person_name || data.ceoName || '',
        member_id: entity.member_id || null,
        goal: entity.goal || '',
        responsible_person: entity.responsible_person || '',
        responsible_person_id: entity.responsible_person_id || null,
        role: entity.role || '',
        title: entity.title || '',
        description: data.description || entity.description || '',
        type: data.type || entity.type || '',
        color: data.color || entity.color || '',
        business_id: entity.business_id || data.business_id || null, // business_id統合用
        task_id: entity.task_id || data.task_id || null,
        needs_migration: entity.needs_migration || false // 実行者の移行フラグ
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

  // 利用可能な業務リストを取得
  const getAvailableTasks = () => {
    return tasks.map(task => ({
      id: task.id,
      name: task.name
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // business_id統合完了: 実行者のbusiness_idは親タスクから自動継承される
    
    // business_id統合完了: Task編集時のバリデーション
    if (nodeData.type === NodeType.TASK) {
      // business_idが空文字の場合はnullに変換
      if (formData.business_id === '') {
        formData.business_id = null
      }
      
      console.log('💾 Task update with business_id:', {
        business_id: formData.business_id
      })
    }
    
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
      case NodeType.COMPANY:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: Empire Art"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEO名</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属事業</label>
              <select
                value={formData.business_id || ''}
                onChange={(e) => setFormData({ ...formData, business_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              >
                <option value="">会社直属（所属事業なし）</option>
                {getAvailableBusinesses().map((business: { id: string; name: string }) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                この業務が所属する事業を選択してください
              </p>
            </div>
          </>
        )
      
      case NodeType.EXECUTOR:
        const availableTasks = getAvailableTasks()
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
              <MemberSelector
                members={members}
                selectedMemberId={formData.member_id}
                onSelect={(memberId) => {
                  const selectedMember = members.find(m => m.id === memberId)
                  setFormData({ 
                    ...formData, 
                    member_id: memberId,
                    name: selectedMember?.name || '',
                    needs_migration: false // 新しく選択したデータは移行不要
                  })
                }}
                placeholder="実行者を選択..."
                searchable={true}
                className="w-full"
              />
              {/* 移行が必要なデータの警告表示 */}
              {formData.needs_migration && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-yellow-800 font-medium">データ更新が必要</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        このデータは古い形式です。上記のドロップダウンから実行者を選択し直してください。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                この業務を実行するメンバーを選択してください
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属業務</label>
              <select
                value={formData.task_id || ''}
                onChange={(e) => setFormData({ ...formData, task_id: e.target.value || null })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">業務を選択...</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                この実行者が所属する業務を選択してください。変更すると属性が自動的に同期されます。
              </p>
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