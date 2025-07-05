'use client'

import { useState, useEffect } from 'react'
import { NodeType } from '@/types/flow'

interface EditNodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, updatedData: any) => void
  nodeData: { id: string; data: any } | null
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
    description: ''
  })

  useEffect(() => {
    if (nodeData?.data?.entity) {
      const entity = nodeData.data.entity
      setFormData({
        name: entity.name || '',
        person_name: entity.person_name || '',
        goal: entity.goal || '',
        responsible_person: entity.responsible_person || '',
        role: entity.role || '',
        title: entity.title || '',
        description: entity.description || ''
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
    
    // CXOカード
    if (entity.person_name !== undefined && entity.name) {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">役職名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              required
            />
          </div>
        </>
      )
    }
    
    // 事業・業務カード
    if (entity.goal !== undefined) {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entity.responsible_person ? '事業名/業務名' : '名前'}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
            />
          </div>
          {entity.responsible_person !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">責任者</label>
              <input
                type="text"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          )}
        </>
      )
    }
    
    // 実行者カード
    if (entity.role !== undefined) {
      return (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
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
              required
            />
          </div>
        </>
      )
    }
    
    // 会社カード
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">会社名</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          required
        />
      </div>
    )
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