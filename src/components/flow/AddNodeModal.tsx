'use client'

import { useState } from 'react'
import { NodeType } from '@/types/flow'

interface AddNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (nodeType: NodeType, data: any) => void
  parentNodeId?: string
  parentNodeType?: NodeType
}

export default function AddNodeModal({ 
  isOpen, 
  onClose, 
  onAddNode, 
  parentNodeId, 
  parentNodeType 
}: AddNodeModalProps) {
  const [selectedType, setSelectedType] = useState<NodeType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    person_name: '',
    goal: '',
    responsible_person: '',
    role: ''
  })

  if (!isOpen) return null

  // 親ノードタイプに応じて追加可能なノードタイプを決定
  const getAvailableNodeTypes = () => {
    if (!parentNodeType) {
      return [
        { type: NodeType.CXO, label: 'CXO', description: '経営陣・役職者' },
        { type: NodeType.BUSINESS, label: '事業', description: '事業部門' },
        { type: NodeType.TASK, label: '業務', description: '具体的な業務' },
        { type: NodeType.EXECUTOR, label: '実行者', description: '実際の担当者' }
      ]
    }

    switch (parentNodeType) {
      case NodeType.CXO_LAYER:
        return [{ type: NodeType.CXO, label: 'CXO', description: '経営陣・役職者' }]
      case NodeType.BUSINESS_LAYER:
        return [
          { type: NodeType.BUSINESS, label: '事業', description: '事業部門' },
          { type: NodeType.TASK, label: '業務', description: '具体的な業務' },
          { type: NodeType.EXECUTOR, label: '実行者', description: '実際の担当者' }
        ]
      case NodeType.BUSINESS:
        return [
          { type: NodeType.TASK, label: '業務', description: '具体的な業務' }
        ]
      case NodeType.TASK:
        return [
          { type: NodeType.EXECUTOR, label: '実行者', description: '実際の担当者' }
        ]
      default:
        return []
    }
  }

  const availableTypes = getAvailableNodeTypes()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType) return

    const nodeData = {
      id: `${selectedType}-${Date.now()}`,
      type: selectedType,
      ...formData,
      parentNodeId
    }

    console.log('🔵 ADD NODE MODAL SUBMIT:', { selectedType, nodeData })
    onAddNode(selectedType, nodeData)
    onClose()
    setSelectedType(null)
    setFormData({
      name: '',
      person_name: '',
      goal: '',
      responsible_person: '',
      role: ''
    })
  }

  const renderFormFields = () => {
    if (!selectedType) return null

    switch (selectedType) {
      case NodeType.CXO:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                役職名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: CTO, CFO"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名
              </label>
              <input
                type="text"
                value={formData.person_name}
                onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事業名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: Webサービス事業"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標
              </label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: ユーザー数100万人達成"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                責任者
              </label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: 佐藤花子"
                required
              />
            </div>
          </>
        )
      case NodeType.TASK:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                業務名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: プロダクト開発"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標
              </label>
              <input
                type="text"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: 新機能リリース"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                責任者
              </label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: 山田太郎"
                required
              />
            </div>
          </>
        )
      case NodeType.EXECUTOR:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: 開発者A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                役割
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="例: フロントエンド開発"
                required
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ノードを追加</h2>
        
        {!selectedType ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">追加するノードタイプを選択してください</p>
            {availableTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                onClick={() => setSelectedType(nodeType.type)}
                className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-800">{nodeType.label}</div>
                <div className="text-sm text-gray-600">{nodeType.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-800">
                {availableTypes.find(t => t.type === selectedType)?.label} を追加
              </h3>
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← 戻る
              </button>
            </div>
            
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
                追加
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}