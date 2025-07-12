'use client'

import OrganizationFlowBoard from '@/components/flow/OrganizationFlowBoard'
import { ReactFlowProvider } from '@xyflow/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { OrganizationDataService, OrganizationData } from '@/lib/services/organizationDataService'
import { NodePositionService } from '@/lib/services/nodePositionService'
import MemoPanel from '@/components/memo/MemoPanel'
import MemberFilter from '@/components/filters/MemberFilter'

function DashboardContent() {
  const { user, member: currentUser, signOut } = useAuth()
  const [viewMode, setViewMode] = useState<'company' | 'business'>('company')
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null)
  const [loading, setLoading] = useState(false) // 強制的にfalse
  
  // タブ別ノード位置保持機能
  const [nodePositionsByTab, setNodePositionsByTab] = useState<Record<string, Record<string, { x: number; y: number }>>>({
    company: {}
  })

  // メモパネル状態
  const [isMemoOpen, setIsMemoOpen] = useState(false)
  const [memoPanelWidth, setMemoPanelWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth * 0.25 : 400
  )

  // メモパネル状態をlocalStorageから復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOpen = localStorage.getItem('memo-panel-open')
      const savedWidth = localStorage.getItem('memo-panel-width')
      
      if (savedOpen !== null) {
        setIsMemoOpen(savedOpen === 'true')
      }
      if (savedWidth !== null) {
        setMemoPanelWidth(Number(savedWidth))
      }
    }
  }, [])

  // メモパネル状態変更時にlocalStorageに保存
  const handleMemoToggle = () => {
    const newOpen = !isMemoOpen
    setIsMemoOpen(newOpen)
    if (typeof window !== 'undefined') {
      localStorage.setItem('memo-panel-open', String(newOpen))
    }
  }

  const handleMemoWidthChange = (newWidth: number) => {
    setMemoPanelWidth(newWidth)
    if (typeof window !== 'undefined') {
      localStorage.setItem('memo-panel-width', String(newWidth))
    }
  }

  const handleMemoClose = () => {
    setIsMemoOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('memo-panel-open', 'false')
    }
  }

  // メンバーフィルター状態
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // タブ切り替え時にフィルターをリセット
  const handleTabChange = (newViewMode: 'company' | 'business', businessId?: string | null) => {
    setViewMode(newViewMode)
    setSelectedBusiness(businessId || null)
    setSelectedMemberId(null) // フィルターリセット
  }

  // 組織データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return

      setLoading(true)
      try {
        const data = await OrganizationDataService.fetchOrganizationData(currentUser)
        setOrganizationData(data)
        
        // 事業データがある場合、タブ用のノード位置を初期化
        if (data.businesses.length > 0) {
          const businessTabs = Object.fromEntries(
            data.businesses.map(business => [business.id, {}])
          )
          setNodePositionsByTab(prev => ({
            ...prev,
            ...businessTabs
          }))
        }
      } catch (error) {
        console.error('組織データ取得エラー:', error)
        // エラー時は最小限のデータを生成
        setOrganizationData(OrganizationDataService.generateMinimalDemoData(currentUser))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser])
  
  // 現在のタブキーを取得
  const getCurrentTabKey = () => {
    return viewMode === 'company' ? 'company' : selectedBusiness || 'company'
  }
  
  // ノード位置更新ハンドラー（データベースに保存）
  const handleNodePositionUpdate = async (nodeId: string, position: { x: number; y: number }) => {
    console.log('🟢 POSITION UPDATE:', nodeId, position, 'at', new Date().toISOString())
    
    // ローカル状態を即座に更新（UX向上）
    const currentTabKey = getCurrentTabKey()
    console.log('🟢 UPDATING TAB:', currentTabKey)
    setNodePositionsByTab(prev => {
      const newState = {
        ...prev,
        [currentTabKey]: {
          ...prev[currentTabKey],
          [nodeId]: position
        }
      }
      console.log('🟢 NEW STATE:', newState)
      return newState
    })

    // データベースに非同期で保存
    try {
      const result = await NodePositionService.saveNodePosition(nodeId, position)
      if (!result.success) {
        console.error('ノード位置保存エラー:', result.error)
        // エラー時はユーザーに通知（必要に応じて）
      }
    } catch (error) {
      console.error('ノード位置保存例外:', error)
    }
  }

  // ログアウトハンドラー
  const handleSignOut = async () => {
    await signOut()
  }

  // 認証ユーザーまたはデータ読み込み中の場合はローディング
  if (!user || !currentUser || loading || !organizationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!user ? '認証中...' : 
             !currentUser ? 'ユーザー情報読み込み中...' : 
             '組織データ読み込み中...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Vision Board
                </h1>
                <p className="text-indigo-600 mt-1 text-base">Empire Art 組織図管理システム</p>
              </div>
              
              {/* タブナビゲーション */}
              <div className="flex items-center space-x-6">
                <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                  <button 
                    onClick={() => handleTabChange('company')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'company' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    会社
                  </button>
                  
                  {/* 事業ごとのタブ */}
                  {organizationData.businesses.map((business) => (
                    <button 
                      key={business.id}
                      onClick={() => handleTabChange('business', business.id)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'business' && selectedBusiness === business.id
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-600 hover:text-blue-600'
                      }`}
                    >
                      {business.name}
                    </button>
                  ))}
                </nav>
                
                {/* メンバーフィルター */}
                <MemberFilter
                  members={organizationData.members}
                  selectedMemberId={selectedMemberId}
                  onMemberSelect={setSelectedMemberId}
                  className="hidden md:block" // モバイルでは非表示
                />
                
                {/* メモボタン */}
                <button
                  onClick={handleMemoToggle}
                  className={`p-2 rounded-lg transition-colors ${
                    isMemoOpen 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white'
                  }`}
                  title="メモ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                {/* 設定ボタン */}
                <Link 
                  href="/settings"
                  className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                  title="設定"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>

                {/* ユーザー情報とログアウト */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.permission}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                    title="ログアウト"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <OrganizationFlowBoard 
          companies={organizationData.companies}
          positions={organizationData.positions}
          layers={organizationData.layers}
          businesses={organizationData.businesses}
          tasks={organizationData.tasks}
          executors={organizationData.executors}
          members={organizationData.members}
          currentUser={currentUser}
          viewMode={viewMode}
          selectedBusinessId={selectedBusiness}
          nodePositions={nodePositionsByTab[getCurrentTabKey()]}
          onNodePositionUpdate={handleNodePositionUpdate}
          selectedMemberId={selectedMemberId}
        />
        
        {/* メモパネル */}
        <MemoPanel
          isOpen={isMemoOpen}
          onClose={handleMemoClose}
          width={memoPanelWidth}
          onWidthChange={handleMemoWidthChange}
        />
      </main>
    </ReactFlowProvider>
  )
}

export default function FlowDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}