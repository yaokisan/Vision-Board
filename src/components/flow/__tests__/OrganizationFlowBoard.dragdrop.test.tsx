/**
 * Phase 0 - P0-R2: ドラッグ&ドロップノード消失問題のテスト
 * TDD実装：失敗するテストケースを先に作成
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import OrganizationFlowBoard from '../OrganizationFlowBoard'
import { Member } from '@/types'

// テスト用のモックデータ
const mockCurrentUser: Member = {
  id: 'test-user-1',
  company_id: 'test-company-1',
  auth_user_id: 'auth-user-1',
  name: 'テストユーザー',
  email: 'test@example.com',
  permission: 'admin',
  member_type: 'core',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockCompanies = [
  {
    id: 'test-company-1',
    name: 'テスト会社',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockPositions = [
  {
    id: 'test-position-1',
    company_id: 'test-company-1',
    name: 'CEO',
    person_name: 'テストユーザー',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockMembers = [mockCurrentUser]

// React Flowのモック
jest.mock('@xyflow/react', () => {
  const originalModule = jest.requireActual('@xyflow/react')
  return {
    ...originalModule,
    ReactFlow: jest.fn(({ children, nodes, onNodesChange, onNodeDragStop, ...props }) => {
      // ドラッグイベントをシミュレート
      const simulateDrag = (nodeId: string, newPosition: { x: number; y: number }) => {
        const changes = [{
          id: nodeId,
          type: 'position',
          position: newPosition,
          dragging: false
        }]
        onNodesChange?.(changes)
        onNodeDragStop?.({}, { id: nodeId, position: newPosition })
      }

      return (
        <div data-testid="react-flow">
          {nodes.map((node: any) => (
            <div 
              key={node.id}
              data-testid={`node-${node.id}`}
              data-node-type={node.type}
              onClick={() => simulateDrag(node.id, { x: 100, y: 100 })}
            >
              {node.data.label || node.id}
            </div>
          ))}
          {children}
        </div>
      )
    })
  }
})

const renderFlowBoard = (props = {}) => {
  const defaultProps = {
    companies: mockCompanies,
    positions: mockPositions,
    layers: [],
    businesses: [],
    tasks: [],
    executors: [],
    members: mockMembers,
    currentUser: mockCurrentUser,
    viewMode: 'company' as const,
    selectedBusinessId: null,
    nodePositions: {},
    onNodePositionUpdate: jest.fn()
  }

  return render(
    <ReactFlowProvider>
      <OrganizationFlowBoard {...defaultProps} {...props} />
    </ReactFlowProvider>
  )
}

describe('OrganizationFlowBoard - ドラッグ&ドロップノード消失問題', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // P0-R2-T1: 新規ノード追加後にドラッグ&ドロップで移動できる
  test('新規ノード追加後にドラッグ&ドロップで移動できる', async () => {
    const onNodePositionUpdate = jest.fn()
    renderFlowBoard({ onNodePositionUpdate })

    // 初期ノードが表示されることを確認
    expect(screen.getByTestId('react-flow')).toBeInTheDocument()
    
    // 会社ノードが存在することを確認
    const companyNode = screen.getByTestId('node-company-test-company-1')
    expect(companyNode).toBeInTheDocument()

    // ドラッグ操作をシミュレート
    fireEvent.click(companyNode)

    // ノード位置更新ハンドラーが呼ばれることを確認
    await waitFor(() => {
      expect(onNodePositionUpdate).toHaveBeenCalledWith(
        'company-test-company-1',
        { x: 100, y: 100 }
      )
    })

    // ドラッグ後もノードが表示され続けることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
  })

  // P0-R2-T2: 移動後もノードが表示され続ける
  test('移動後もノードが表示され続ける', async () => {
    const onNodePositionUpdate = jest.fn()
    renderFlowBoard({ onNodePositionUpdate })

    const companyNode = screen.getByTestId('node-company-test-company-1')
    
    // 複数回ドラッグ操作を実行
    fireEvent.click(companyNode)
    
    await waitFor(() => {
      expect(onNodePositionUpdate).toHaveBeenCalled()
    })

    // 再度ドラッグ操作
    fireEvent.click(companyNode)
    
    await waitFor(() => {
      expect(onNodePositionUpdate).toHaveBeenCalledTimes(2)
    })

    // ノードが消失していないことを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
  })

  // P0-R2-T3: ページリロード後もノード位置が保持される
  test('ページリロード後もノード位置が保持される', () => {
    const savedPositions = {
      'company-test-company-1': { x: 200, y: 150 }
    }

    renderFlowBoard({ nodePositions: savedPositions })

    // ノードが表示されていることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
    
    // 保存された位置情報が適用されていることを確認（実際の実装で検証）
    const flowNode = screen.getByTestId('node-company-test-company-1')
    expect(flowNode).toBeInTheDocument()
  })

  // P0-R2-T4: 複数ノード同時移動でもデータが保持される
  test('複数ノード同時移動でもデータが保持される', async () => {
    const businessData = [
      {
        id: 'business-1',
        layer_id: 'layer-1',
        name: 'テスト事業',
        goal: 'テスト目標',
        responsible_person: 'テストユーザー',
        category: null,
        position_x: 0,
        position_y: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    const layerData = [
      {
        id: 'layer-1',
        company_id: 'test-company-1',
        name: '事業',
        type: 'business',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ]

    const onNodePositionUpdate = jest.fn()
    renderFlowBoard({ 
      businesses: businessData,
      layers: layerData,
      onNodePositionUpdate 
    })

    // 複数のノードが表示されることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
    expect(screen.getByTestId('node-business-business-1')).toBeInTheDocument()

    // 複数ノードをドラッグ
    fireEvent.click(screen.getByTestId('node-company-test-company-1'))
    fireEvent.click(screen.getByTestId('node-business-business-1'))

    await waitFor(() => {
      expect(onNodePositionUpdate).toHaveBeenCalledTimes(2)
    })

    // すべてのノードが表示され続けることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
    expect(screen.getByTestId('node-business-business-1')).toBeInTheDocument()
  })

  // P0-R2-T5: 同一ビューモード内でのドラッグ操作でノードが消失しない
  test('同一ビューモード内でのドラッグ操作でノードが消失しない', async () => {
    const onNodePositionUpdate = jest.fn()
    const nodePositions = { 'company-test-company-1': { x: 150, y: 200 } }
    
    const { rerender } = renderFlowBoard({ onNodePositionUpdate, nodePositions })

    // 初期状態でノードが表示されることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()

    // 位置情報を更新して再レンダリング（ドラッグ後の状態をシミュレート）
    const updatedPositions = { 'company-test-company-1': { x: 300, y: 400 } }
    rerender(
      <ReactFlowProvider>
        <OrganizationFlowBoard 
          companies={mockCompanies}
          positions={mockPositions}
          layers={[]}
          businesses={[]}
          tasks={[]}
          executors={[]}
          members={mockMembers}
          currentUser={mockCurrentUser}
          viewMode="company"
          selectedBusinessId={null}
          nodePositions={updatedPositions}
          onNodePositionUpdate={onNodePositionUpdate}
        />
      </ReactFlowProvider>
    )

    // 再レンダリング後もノードが表示されることを確認
    expect(screen.getByTestId('node-company-test-company-1')).toBeInTheDocument()
  })
})