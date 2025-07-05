import OrganizationFlowBoard from '@/components/flow/OrganizationFlowBoard'
import { ReactFlowProvider } from '@xyflow/react'

// サンプルデータ（実際のプロジェクトではSupabaseから取得）
const sampleData = {
  companies: [
    {
      id: '1',
      name: 'Empire Art',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ],
  positions: [
    {
      id: '1',
      company_id: '1',
      name: 'CEO',
      person_name: '田中太郎',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '2',
      company_id: '1',
      name: 'CTO',
      person_name: '佐藤花子',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '3',
      company_id: '1',
      name: 'CFO',
      person_name: '鈴木一郎',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ],
  layers: [
    {
      id: '1',
      company_id: '1',
      name: '事業',
      type: 'business',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
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
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '2',
      task_id: '1',
      name: '開発者B',
      role: 'バックエンド',
      position_x: 150,
      position_y: 800,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '3',
      task_id: '2',
      name: 'マーケターA',
      role: 'デジタル広告',
      position_x: 250,
      position_y: 800,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '4',
      task_id: '2',
      name: 'マーケターB',
      role: 'コンテンツ',
      position_x: 350,
      position_y: 800,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    },
    {
      id: '5',
      task_id: '3',
      name: 'CS担当者',
      role: 'サポート',
      position_x: 450,
      position_y: 800,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01')
    }
  ]
}

export default function FlowDashboard() {
  return (
    <ReactFlowProvider>
      <main className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">📋</span>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Vision Board
                </h1>
                <p className="text-indigo-600 mt-1 text-lg">Empire Art 組織図管理システム</p>
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
        />
      </main>
    </ReactFlowProvider>
  )
}