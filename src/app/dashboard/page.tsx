import OrganizationBoard from '@/components/board/OrganizationBoard'

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Empire Art - 組織図</h1>
          <p className="text-gray-600 mt-2">現在の組織構成を確認・編集できます</p>
        </div>
      </div>
      <OrganizationBoard />
    </main>
  )
}