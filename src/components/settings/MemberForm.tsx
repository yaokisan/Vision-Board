'use client'

/**
 * メンバーフォームコンポーネント
 * 新規追加・編集用
 */

import { useState, useEffect } from 'react'
import { Member, CreateMemberRequest } from '@/types'

interface MemberFormProps {
  mode: 'add' | 'edit'
  member?: Member
  companyId: string
  onSubmit: (data: any) => void
  onCancel: () => void
}

interface FormData {
  name: string
  email: string
  permission: string
  member_type: string
}

interface FormErrors {
  name?: string
  email?: string
}

export function MemberForm({ mode, member, companyId, onSubmit, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: member?.name || '',
    email: member?.email || '',
    permission: member?.permission || 'viewer',
    member_type: member?.member_type || 'business'
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です'
    }

    // メールアドレスは任意、入力されている場合のみバリデーション
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      if (mode === 'add') {
        const createData: CreateMemberRequest = {
          company_id: companyId,
          name: formData.name.trim(),
          email: formData.email.trim() || undefined, // 空文字の場合はundefinedに
          permission: formData.permission as any,
          member_type: formData.member_type as any
        }
        await onSubmit(createData)
      } else {
        // 編集の場合は変更された項目のみ送信
        const updateData: any = {}
        if (formData.name !== member?.name) {
          updateData.name = formData.name.trim()
        }
        if (formData.email !== member?.email) {
          updateData.email = formData.email.trim() || undefined
        }
        if (formData.permission !== member?.permission) {
          updateData.permission = formData.permission
        }
        if (formData.member_type !== member?.member_type) {
          updateData.member_type = formData.member_type
        }
        await onSubmit(updateData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 入力変更ハンドラー
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // エラーをクリア
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {mode === 'add' ? '新規メンバー追加' : 'メンバー情報編集'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 名前 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={false}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={false}
                placeholder="example@company.com"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* 権限 */}
            <div>
              <label htmlFor="permission" className="block text-sm font-medium text-gray-700 mb-1">
                権限
              </label>
              <select
                id="permission"
                value={formData.permission}
                onChange={(e) => handleChange('permission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">管理者</option>
                <option value="viewer">閲覧者</option>
                <option value="restricted">制限ユーザー</option>
              </select>
            </div>

            {/* メンバータイプ */}
            <div>
              <label htmlFor="member_type" className="block text-sm font-medium text-gray-700 mb-1">
                メンバータイプ
              </label>
              <select
                id="member_type"
                value={formData.member_type}
                onChange={(e) => handleChange('member_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="core">コアメンバー</option>
                <option value="business">事業メンバー</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                コアメンバーは全事業に表示されます。事業メンバーは特定事業のみに表示されます。
              </p>
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? '処理中...' : mode === 'add' ? '追加' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}