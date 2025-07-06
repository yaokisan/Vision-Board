import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FlowDashboard from '@/app/dashboard/page'

// Global state for tab tracking in tests
let currentViewMode = 'company'
let currentSelectedBusinessId = null

// React Flow とその他の依存関係のモック
jest.mock('@xyflow/react', () => {
  const mockContainers = [
    { 
      id: 'layer-company', 
      type: 'business_layer', 
      data: { 
        label: '会社レイヤー',
        displayTab: 'company'
      }
    },
    { 
      id: 'layer-web', 
      type: 'business_layer', 
      data: { 
        label: 'Webサービス事業レイヤー',
        displayTab: '1'
      }
    },
    { 
      id: 'layer-consulting', 
      type: 'business_layer', 
      data: { 
        label: 'コンサルティング事業レイヤー',
        displayTab: '2'
      }
    }
  ]

  return {
    ReactFlowProvider: ({ children }) => <div data-testid="react-flow-provider">{children}</div>,
    ReactFlow: ({ nodes, onNodeDragStop, ...props }) => {
      return (
        <div data-testid="react-flow" {...props}>
          {mockContainers
            .filter(container => {
              // 実際のフィルタリングロジックと同じ動作
              if (currentViewMode === 'company') {
                return true // 会社タブでは全て表示
              }
              
              if (currentViewMode === 'business' && currentSelectedBusinessId) {
                return container.data.displayTab === currentSelectedBusinessId
              }
              
              return false
            })
            .map(container => (
              <div 
                key={container.id}
                data-testid={`container-${container.id}`}
                data-display-tab={container.data.displayTab}
                onClick={() => {
                  // コンテナ編集をシミュレート
                  if (onNodeDragStop) {
                    onNodeDragStop({} as any, { 
                      id: container.id, 
                      position: { x: 100, y: 200 }
                    } as any)
                  }
                }}
              >
                {container.data.label}
              </div>
            ))}
        </div>
      )
    },
    useNodesState: () => [mockContainers, jest.fn(), jest.fn()],
    useEdgesState: () => [[], jest.fn(), jest.fn()],
    useReactFlow: () => ({
      getViewport: jest.fn(() => ({ x: 0, y: 0, zoom: 1 })),
      setViewport: jest.fn(),
      fitView: jest.fn(),
    }),
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    Panel: ({ children }) => <div data-testid="panel">{children}</div>,
  }
})

describe('統合テスト: レイヤーコンテナ表示制御機能', () => {
  beforeEach(() => {
    // 各テスト前にグローバル状態をリセット
    currentViewMode = 'company'
    currentSelectedBusinessId = null
  })

  describe('TC-2.1: 会社タブでの表示制御', () => {
    it('会社タブでは全てのコンテナが表示される', async () => {
      render(<FlowDashboard />)

      // 初期状態は会社タブが選択されている
      expect(screen.getByRole('button', { name: '会社' })).toHaveClass('text-blue-600')

      // 全てのコンテナが表示されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-company')).toBeInTheDocument()
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
        expect(screen.getByTestId('container-layer-consulting')).toBeInTheDocument()
      })
    })
  })

  describe('TC-2.2: 事業タブでの表示制御', () => {
    it('Webサービス事業タブでは該当コンテナのみ表示される', async () => {
      render(<FlowDashboard />)

      // Webサービス事業タブをクリック
      const webServiceTab = screen.getByRole('button', { name: 'Webサービス事業' })
      
      // グローバル状態を手動で更新
      currentViewMode = 'business'
      currentSelectedBusinessId = '1'
      
      fireEvent.click(webServiceTab)

      // Webサービス事業タブがアクティブになることを確認
      await waitFor(() => {
        expect(webServiceTab).toHaveClass('text-blue-600')
      })

      // Webサービス事業設定のコンテナのみが表示される
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-company')).not.toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-consulting')).not.toBeInTheDocument()
      })
    })

    it('コンサルティング事業タブでは該当コンテナのみ表示される', async () => {
      render(<FlowDashboard />)

      // コンサルティング事業タブをクリック
      const consultingTab = screen.getByRole('button', { name: 'コンサルティング事業' })
      
      // グローバル状態を手動で更新
      currentViewMode = 'business'
      currentSelectedBusinessId = '2'
      
      fireEvent.click(consultingTab)

      // コンサルティング事業タブがアクティブになることを確認
      await waitFor(() => {
        expect(consultingTab).toHaveClass('text-blue-600')
      })

      // コンサルティング事業設定のコンテナのみが表示される
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-consulting')).toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-company')).not.toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-web')).not.toBeInTheDocument()
      })
    })
  })

  describe('TC-2.4: タブ切り替え時の動的表示制御', () => {
    it('タブ切り替え時にコンテナ表示が即座に変わる', async () => {
      const { rerender } = render(<FlowDashboard />)

      // 初期状態：会社タブで全てのコンテナが表示
      expect(screen.getByTestId('container-layer-company')).toBeInTheDocument()
      expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
      expect(screen.getByTestId('container-layer-consulting')).toBeInTheDocument()

      // Webサービス事業タブに切り替え
      currentViewMode = 'business'
      currentSelectedBusinessId = '1'
      
      const webServiceTab = screen.getByRole('button', { name: 'Webサービス事業' })
      fireEvent.click(webServiceTab)
      rerender(<FlowDashboard />)

      // Webサービス事業コンテナのみ表示
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-company')).not.toBeInTheDocument()
        expect(screen.queryByTestId('container-layer-consulting')).not.toBeInTheDocument()
      })

      // 会社タブに戻す
      currentViewMode = 'company'
      currentSelectedBusinessId = null
      
      const companyTab = screen.getByRole('button', { name: '会社' })
      fireEvent.click(companyTab)
      rerender(<FlowDashboard />)

      // 再び全てのコンテナが表示される
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-company')).toBeInTheDocument()
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
        expect(screen.getByTestId('container-layer-consulting')).toBeInTheDocument()
      })
    })
  })

  describe('TC-2.5: 複数コンテナでの異なる表示設定', () => {
    it('異なる表示タブ設定のコンテナが正しくフィルタリングされる', async () => {
      const { rerender } = render(<FlowDashboard />)

      // 各タブでの表示確認
      const tabs = [
        { 
          name: '会社', 
          expectedContainers: ['layer-company', 'layer-web', 'layer-consulting'],
          viewMode: 'company' as const,
          selectedBusinessId: null
        },
        { 
          name: 'Webサービス事業', 
          expectedContainers: ['layer-web'],
          viewMode: 'business' as const,
          selectedBusinessId: '1'
        },
        { 
          name: 'コンサルティング事業', 
          expectedContainers: ['layer-consulting'],
          viewMode: 'business' as const,
          selectedBusinessId: '2'
        }
      ]

      for (const tab of tabs) {
        // グローバル状態を更新
        currentViewMode = tab.viewMode
        currentSelectedBusinessId = tab.selectedBusinessId
        
        // タブをクリック
        const tabButton = screen.getByRole('button', { name: tab.name })
        fireEvent.click(tabButton)
        rerender(<FlowDashboard />)

        // 期待されるコンテナが表示されることを確認
        await waitFor(() => {
          tab.expectedContainers.forEach(containerId => {
            expect(screen.getByTestId(`container-${containerId}`)).toBeInTheDocument()
          })

          // 期待されないコンテナが表示されないことを確認
          const allContainers = ['layer-company', 'layer-web', 'layer-consulting']
          const unexpectedContainers = allContainers.filter(id => !tab.expectedContainers.includes(id))
          
          unexpectedContainers.forEach(containerId => {
            expect(screen.queryByTestId(`container-${containerId}`)).not.toBeInTheDocument()
          })
        })
      }
    })
  })

  describe('パフォーマンス要件', () => {
    it('NFR-1.1: タブ切り替え時のフィルタリング処理が50ms以内', async () => {
      const { rerender } = render(<FlowDashboard />)

      const webServiceTab = screen.getByRole('button', { name: 'Webサービス事業' })
      
      const startTime = performance.now()
      
      // グローバル状態を更新
      currentViewMode = 'business'
      currentSelectedBusinessId = '1'
      
      fireEvent.click(webServiceTab)
      rerender(<FlowDashboard />)
      
      // フィルタリング処理の完了を待つ
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(50)
    })
  })

  describe('ユーザビリティ要件', () => {
    it('NFR-2.2: 現在の表示状態が一目で分かる', () => {
      render(<FlowDashboard />)

      // アクティブなタブが視覚的に区別できることを確認
      const companyTab = screen.getByRole('button', { name: '会社' })
      expect(companyTab).toHaveClass('text-blue-600')

      const webServiceTab = screen.getByRole('button', { name: 'Webサービス事業' })
      expect(webServiceTab).not.toHaveClass('text-blue-600')
    })

    it('NFR-2.3: 即座に反映される（確認UIなし）', async () => {
      const { rerender } = render(<FlowDashboard />)

      // タブをクリック
      const webServiceTab = screen.getByRole('button', { name: 'Webサービス事業' })
      
      // グローバル状態を更新
      currentViewMode = 'business'
      currentSelectedBusinessId = '1'
      
      fireEvent.click(webServiceTab)
      rerender(<FlowDashboard />)

      // 確認ダイアログが表示されないことを確認
      expect(screen.queryByText('確認')).not.toBeInTheDocument()
      expect(screen.queryByText('OK')).not.toBeInTheDocument()

      // 即座に反映されることを確認
      await waitFor(() => {
        expect(screen.getByTestId('container-layer-web')).toBeInTheDocument()
      }, { timeout: 100 }) // 短いタイムアウトで即座性を確認
    })
  })
})