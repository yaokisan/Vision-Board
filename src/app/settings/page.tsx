'use client'

import Link from 'next/link'
import { MemberManagement } from '@/components/settings/MemberManagement'
import { Member } from '@/types'

// テスト用の現在ユーザー（実際のプロジェクトでは認証システムから取得）
const getCurrentUser = (): Member => ({
  id: '550e8400-e29b-41d4-a716-446655440020',
  company_id: '550e8400-e29b-41d4-a716-446655440000',
  name: '田中太郎',
  email: 'tanaka@empire-art.com',
  permission: 'admin',
  member_type: 'core',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
})

export default function SettingsPage() {
  const currentUser = getCurrentUser()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                設定
              </h1>
              <p className="text-indigo-600 mt-1 text-base">システム設定</p>
            </div>
            
            {/* 戻るボタン */}
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-gray-200"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <MemberManagement currentUser={currentUser} />
      </div>
    </main>
  )
}