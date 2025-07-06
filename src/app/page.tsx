'use client'

import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

function HomeContent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Vision Board
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          動的組織図管理アプリケーション
        </p>
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            新規登録
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <ProtectedRoute requireAuth={false}>
      <HomeContent />
    </ProtectedRoute>
  )
}