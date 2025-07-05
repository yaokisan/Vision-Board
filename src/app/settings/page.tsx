import Link from 'next/link'

export default function SettingsPage() {
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            設定項目
          </h2>
          <p className="text-gray-600">
            設定機能は準備中です。
          </p>
        </div>
      </div>
    </main>
  )
}