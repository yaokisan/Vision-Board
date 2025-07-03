import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Vision Board
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          動的組織図管理アプリケーション
        </p>
        <Link
          href="/dashboard"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          ダッシュボードへ
        </Link>
      </div>
    </main>
  )
}