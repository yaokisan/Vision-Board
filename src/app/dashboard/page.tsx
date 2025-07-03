import OrganizationBoard from '@/components/board/OrganizationBoard'

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-3xl font-bold">Empire Art - 組織図</h1>
        <p className="text-blue-100 mt-2">現在の組織構成を確認・編集できます</p>
      </div>
      <OrganizationBoard />
    </main>
  )
}