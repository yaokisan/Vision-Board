'use client'

import OrganizationFlowBoard from '@/components/flow/OrganizationFlowBoard'
import { ReactFlowProvider } from '@xyflow/react'
import { useState } from 'react'
import Link from 'next/link'

// サンプルデータ（実際のプロジェクトではSupabaseから取得）
const sampleData = {
  companies: [
    {
      id: '1',
      name: 'Empire Art',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  positions: [
    {
      id: '1',
      company_id: '1',
      name: 'CEO',
      person_name: '田中太郎',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      company_id: '1',
      name: 'CTO',
      person_name: '佐藤花子',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      company_id: '1',
      name: 'CFO',
      person_name: '鈴木一郎',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  layers: [
    {
      id: '1',
      company_id: '1',
      name: '事業',
      type: 'business',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      displayTab: 'company' // 会社タブで表示
    },
    {
      id: '2',
      company_id: '1',
      name: 'Webサービス事業',
      type: 'business',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      displayTab: '1' // Webサービス事業タブで表示
    },
    {
      id: '3',
      company_id: '1',
      name: 'コンサルティング事業',
      type: 'business',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      displayTab: '2' // コンサルティング事業タブで表示
    }
  ],
  businesses: [
    {
      id: '1',
      layer_id: '1',
      name: 'Webサービス事業',
      goal: 'ユーザー数100万人達成',
      responsible_person: '田中太郎',
      category: 'デジタル',
      position_x: 100,
      position_y: 400,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      layer_id: '1',
      name: 'コンサルティング事業',
      goal: '売上前年比150%',
      responsible_person: '佐藤花子',
      category: 'サービス',
      position_x: 400,
      position_y: 400,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  tasks: [
    {
      id: '1',
      business_id: '1',
      layer_id: '1',
      name: 'プロダクト開発',
      goal: '新機能リリース',
      responsible_person: '山田太郎',
      group_name: '開発',
      position_x: 100,
      position_y: 600,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      business_id: '1',
      layer_id: '1',
      name: 'マーケティング',
      goal: 'ユーザー獲得',
      responsible_person: '田中花子',
      group_name: '営業',
      position_x: 300,
      position_y: 600,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      business_id: '2',
      layer_id: '1',
      name: 'クライアント対応',
      goal: '顧客満足度向上',
      responsible_person: '鈴木次郎',
      group_name: 'CS',
      position_x: 400,
      position_y: 600,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  executors: [
    {
      id: '1',
      task_id: '1',
      name: '開発者A',
      role: 'フロントエンド',
      position_x: 50,
      position_y: 800,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      task_id: '1',
      name: '開発者B',
      role: 'バックエンド',
      position_x: 150,
      position_y: 800,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '3',
      task_id: '2',
      name: 'マーケターA',
      role: 'デジタル広告',
      position_x: 250,
      position_y: 800,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '4',
      task_id: '2',
      name: 'マーケターB',
      role: 'コンテンツ',
      position_x: 350,
      position_y: 800,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '5',
      task_id: '3',
      name: 'CS担当者',
      role: 'サポート',
      position_x: 450,
      position_y: 800,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
}

export default function FlowDashboard() {
  const [viewMode, setViewMode] = useState<'company' | 'business'>('company')
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  
  // タブ別ノード位置保持機能
  const [nodePositionsByTab, setNodePositionsByTab] = useState<Record<string, Record<string, { x: number; y: number }>>>({
    company: {},
    ...Object.fromEntries(sampleData.businesses.map(business => [business.id, {}]))
  })
  
  // 現在のタブキーを取得
  const getCurrentTabKey = () => {
    return viewMode === 'company' ? 'company' : selectedBusiness || 'company'
  }
  
  // ノード位置更新ハンドラー
  const handleNodePositionUpdate = (nodeId: string, position: { x: number; y: number }) => {
    const currentTabKey = getCurrentTabKey()
    setNodePositionsByTab(prev => ({
      ...prev,
      [currentTabKey]: {
        ...prev[currentTabKey],
        [nodeId]: position
      }
    }))
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
                    onClick={() => {
                      setViewMode('company')
                      setSelectedBusiness(null)
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'company' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    会社
                  </button>
                  
                  {/* 事業ごとのタブ */}
                  {sampleData.businesses.map((business) => (
                    <button 
                      key={business.id}
                      onClick={() => {
                        setViewMode('business')
                        setSelectedBusiness(business.id)
                      }}
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
                
                {/* 設定ボタン */}
                <Link 
                  href="/settings"
                  className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.50 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <OrganizationFlowBoard 
          companies={sampleData.companies}
          positions={sampleData.positions}
          layers={sampleData.layers}
          businesses={sampleData.businesses}
          tasks={sampleData.tasks}
          executors={sampleData.executors}
          viewMode={viewMode}
          selectedBusinessId={selectedBusiness}
          nodePositions={nodePositionsByTab[getCurrentTabKey()]}
          onNodePositionUpdate={handleNodePositionUpdate}
        />
      </main>
    </ReactFlowProvider>
  )
}