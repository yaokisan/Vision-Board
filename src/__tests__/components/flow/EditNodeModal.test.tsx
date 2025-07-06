import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditNodeModal from '@/components/flow/EditNodeModal'
import { MockDataFactory } from '@//__tests__/utils/testHelpers'

// モックデータ
const mockBusinesses = [
  MockDataFactory.createBusiness({ id: '1', name: 'Webサービス事業' }),
  MockDataFactory.createBusiness({ id: '2', name: 'コンサルティング事業' })
]

describe('EditNodeModal - レイヤーコンテナ表示タブ選択機能', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    nodeData: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TC-1.1: 表示タブ選択UIの表示', () => {
    it('レイヤーコンテナ編集時に表示タブ選択フィールドが表示される', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // 表示タブ選択フィールドが存在することを確認
      expect(screen.getByText('表示タブ')).toBeInTheDocument()
    })

    it('非レイヤーコンテナでは表示タブ選択フィールドが表示されない', () => {
      const businessNodeData = {
        id: 'business-1',
        type: 'business',
        data: {
          entity: MockDataFactory.createBusiness(),
          label: 'テスト事業'
        }
      }

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={businessNodeData}
        />
      )

      // 表示タブ選択フィールドが存在しないことを確認
      expect(screen.queryByText('表示タブ')).not.toBeInTheDocument()
    })
  })

  describe('TC-1.2: 表示タブ選択肢の動的生成', () => {
    it('会社と全事業の選択肢が表示される', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      // グローバルにビジネスデータを設定するモック
      const originalGetBusinesses = global.getBusinesses
      global.getBusinesses = jest.fn(() => mockBusinesses)

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // 会社選択肢（ラジオボタンの場合は値で検索）
      expect(screen.getByRole('radio', { name: '会社' })).toBeInTheDocument()
      
      // 事業選択肢
      expect(screen.getByRole('radio', { name: 'Webサービス事業' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'コンサルティング事業' })).toBeInTheDocument()

      // クリーンアップ
      global.getBusinesses = originalGetBusinesses
    })
  })

  describe('TC-1.3: 現在の設定値表示', () => {
    it('会社設定の場合、会社が選択されている', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // 会社が選択されていることを確認
      const companyOption = screen.getByRole('radio', { name: '会社' })
      expect(companyOption).toBeChecked()
    })

    it('事業設定の場合、該当事業が選択されている', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: '1' // Webサービス事業のID
        }
      }

      global.getBusinesses = jest.fn(() => mockBusinesses)

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // Webサービス事業が選択されていることを確認
      const webServiceOption = screen.getByRole('radio', { name: 'Webサービス事業' })
      expect(webServiceOption).toBeChecked()
    })
  })

  describe('TC-1.4: 表示タブ変更とデータ更新', () => {
    it('表示タブ変更時にデータが正しく更新される', async () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      global.getBusinesses = jest.fn(() => mockBusinesses)

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // Webサービス事業を選択
      const webServiceOption = screen.getByRole('radio', { name: 'Webサービス事業' })
      fireEvent.click(webServiceOption)

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      // onSaveが正しいデータで呼ばれることを確認
      await waitFor(() => {
        expect(mockProps.onSave).toHaveBeenCalledWith(
          'layer-1',
          expect.objectContaining({
            displayTab: '1'
          })
        )
      })
    })

    it('保存せずに閉じた場合はデータが更新されない', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      global.getBusinesses = jest.fn(() => mockBusinesses)

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // Webサービス事業を選択
      const webServiceOption = screen.getByRole('radio', { name: 'Webサービス事業' })
      fireEvent.click(webServiceOption)

      // キャンセルボタンをクリック
      const cancelButton = screen.getByText('キャンセル')
      fireEvent.click(cancelButton)

      // onSaveが呼ばれないことを確認
      expect(mockProps.onSave).not.toHaveBeenCalled()
      expect(mockProps.onClose).toHaveBeenCalled()
    })
  })

  describe('パフォーマンス要件', () => {
    it('NFR-1.2: 編集モーダルが100ms以内に表示される', async () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'company'
        }
      }

      const startTime = performance.now()
      
      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // モーダルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('表示タブ')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(100)
    })
  })

  describe('エラーハンドリング', () => {
    it('不正なdisplayTab値でもエラーにならない', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business',
          displayTab: 'invalid-business-id'
        }
      }

      global.getBusinesses = jest.fn(() => mockBusinesses)

      expect(() => {
        render(
          <EditNodeModal 
            {...mockProps} 
            nodeData={layerNodeData}
          />
        )
      }).not.toThrow()

      // デフォルトで会社が選択されることを確認
      expect(screen.getByRole('radio', { name: '会社' })).toBeChecked()
    })

    it('displayTabが未定義の場合はデフォルトで会社が選択される', () => {
      const layerNodeData = {
        id: 'layer-1',
        type: 'business_layer',
        data: {
          entity: MockDataFactory.createLayer(),
          label: 'テストレイヤー',
          type: 'business'
          // displayTab未定義
        }
      }

      render(
        <EditNodeModal 
          {...mockProps} 
          nodeData={layerNodeData}
        />
      )

      // デフォルトで会社が選択されることを確認
      expect(screen.getByRole('radio', { name: '会社' })).toBeChecked()
    })
  })
})