'use client'

import { useState, useEffect } from 'react'
import { NodeType } from '@/types/flow'

interface EditNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updatedData: any) => void
  nodeData: { id: string; type: string; data: any } | null
}

export default function EditNodeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  nodeData 
}: EditNodeModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    person_name: '',
    goal: '',
    responsible_person: '',
    role: '',
    title: '',
    description: '',
    type: '',
    color: ''
  })

  useEffect(() => {
    if (nodeData?.data) {
      const data = nodeData.data
      const entity = data.entity || {}
      setFormData({
        name: entity.name || data.ceoName || data.label || '',
        person_name: entity.person_name || '',
        goal: entity.goal || '',
        responsible_person: entity.responsible_person || '',
        role: entity.role || '',
        title: entity.title || '',
        description: data.description || entity.description || '',
        type: data.type || entity.type || '',
        color: data.color || entity.color || ''
      })
    }
  }, [nodeData])

  if (!isOpen || !nodeData) return null

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
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 佐藤花子"
              />
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
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="例: 山田一郎"
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">コンテナ色</label>
              <select
                value={formData.color || (nodeData.type === NodeType.CXO_LAYER ? 'purple' : 'gray')}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="gray">グレー</option>
                <option value="blue">ブルー</option>
                <option value="green">グリーン</option>
                <option value="purple">パープル</option>
                <option value="red">レッド</option>
                <option value="yellow">イエロー</option>
                <option value="indigo">インディゴ</option>
                <option value="pink">ピンク</option>
              </select>
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