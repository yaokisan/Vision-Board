'use client'

import Link from 'next/link'
import { MemberManagement } from '@/components/settings/MemberManagement'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

function SettingsContent() {
  const { user, member: currentUser } = useAuth()

  // 認証ユーザーが無い場合はローディング
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // メンバーデータがない場合は一時的にサンプルユーザーを使用
  const displayUser = currentUser || {
    id: user.id,
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
    email: user.email || '',
    permission: 'admin' as const,
    member_type: 'core' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

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
        <MemberManagement currentUser={displayUser} />
      </div>
    </main>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}