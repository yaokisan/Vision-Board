import { FlowDataConverter } from '@/lib/flow/dataConverter'
import { MockDataFactory } from '@//__tests__/utils/testHelpers'

describe('FlowDataConverter - レイヤーコンテナ表示フィルタリング機能', () => {
  const mockCompanies = [MockDataFactory.createCompany()]
  const mockPositions = [
    MockDataFactory.createPosition({ name: 'CEO', person_name: '代表取締役' }),
    MockDataFactory.createPosition({ id: 'pos-2', name: 'CTO', person_name: '技術責任者' })
  ]
  const mockLayers = [MockDataFactory.createLayer()]
  const mockBusinesses = [
    MockDataFactory.createBusiness({ id: '1', name: 'Webサービス事業' }),
    MockDataFactory.createBusiness({ id: '2', name: 'コンサルティング事業' })
  ]
  const mockTasks = []
  const mockExecutors = []

  describe('shouldShowContainer関数', () => {
    it('会社タブでは全てのコンテナが表示される', () => {
      // 異なるdisplayTab設定のコンテナデータを作成
      const containers = [
        { id: 'layer-1', displayTab: 'company' },
        { id: 'layer-2', displayTab: '1' },  // Webサービス事業
        { id: 'layer-3', displayTab: '2' }   // コンサルティング事業
      ]

      containers.forEach(container => {
        const result = FlowDataConverter.shouldShowContainer(container, 'company')
        expect(result).toBe(true)
      })
    })

    it('事業タブでは該当事業設定のコンテナのみ表示される', () => {
      const containers = [
        { id: 'layer-1', displayTab: 'company' },
        { id: 'layer-2', displayTab: '1' },  // Webサービス事業
        { id: 'layer-3', displayTab: '2' }   // コンサルティング事業
      ]

      // Webサービス事業タブの場合
      expect(FlowDataConverter.shouldShowContainer(containers[0], '1')).toBe(false) // 会社設定
      expect(FlowDataConverter.shouldShowContainer(containers[1], '1')).toBe(true)  // Web事業設定
      expect(FlowDataConverter.shouldShowContainer(containers[2], '1')).toBe(false) // コンサル事業設定

      // コンサルティング事業タブの場合
      expect(FlowDataConverter.shouldShowContainer(containers[0], '2')).toBe(false) // 会社設定
      expect(FlowDataConverter.shouldShowContainer(containers[1], '2')).toBe(false) // Web事業設定
      expect(FlowDataConverter.shouldShowContainer(containers[2], '2')).toBe(true)  // コンサル事業設定
    })
  })

  describe('TC-2.1: 会社タブでの表示制御', () => {
    it('全てのレイヤーコンテナが表示される', () => {
      // 異なるdisplayTab設定のサンプルデータを作成
      const testData = {
        companies: mockCompanies,
        positions: mockPositions,
        layers: mockLayers,
        businesses: mockBusinesses,
        tasks: mockTasks,
        executors: mockExecutors
      }

      const flowData = FlowDataConverter.convertToFlowData(
        testData.companies,
        testData.positions,
        testData.layers,
        testData.businesses,
        testData.tasks,
        testData.executors,
        'company'
      )

      // レイヤーコンテナがすべて含まれていることを確認
      const layerNodes = flowData.nodes.filter(node => 
        node.type === 'business_layer' || node.type === 'cxo_layer'
      )
      
      expect(layerNodes.length).toBeGreaterThan(0)
      // 会社タブでは全てのレイヤーが表示される
      expect(layerNodes.every(node => node.id.includes('layer'))).toBe(true)
    })
  })

  describe('TC-2.2: 事業タブでの表示制御', () => {
    it('該当事業設定のコンテナのみ表示される', () => {
      // displayTab設定を持つテストデータを作成
      const customLayers = [
        { ...MockDataFactory.createLayer(), id: 'layer-company', displayTab: 'company' },
        { ...MockDataFactory.createLayer(), id: 'layer-web', displayTab: '1' },
        { ...MockDataFactory.createLayer(), id: 'layer-consul', displayTab: '2' }
      ]

      const flowData = FlowDataConverter.convertToFlowDataWithContainerFilter(
        mockCompanies,
        mockPositions,
        customLayers,
        mockBusinesses,
        mockTasks,
        mockExecutors,
        'business',
        '1' // Webサービス事業
      )

      const layerNodes = flowData.nodes.filter(node => 
        node.type === 'business_layer' || node.type === 'cxo_layer'
      )


      // Webサービス事業設定のコンテナのみが表示される
      const webBusinessLayerExists = layerNodes.some(node => 
        node.id === 'layer-layer-web'
      )
      expect(webBusinessLayerExists).toBe(true)

      // 会社設定およびコンサルティング事業設定のコンテナは表示されない
      const companyLayerExists = layerNodes.some(node => 
        node.id === 'layer-layer-company'
      )
      const consultingLayerExists = layerNodes.some(node => 
        node.id === 'layer-layer-consul'
      )
      expect(companyLayerExists).toBe(false)
      expect(consultingLayerExists).toBe(false)
    })
  })

  describe('TC-2.3: 表示設定変更時の動的フィルタリング', () => {
    it('タブ切り替え時にフィルタリングが正しく動作する', () => {
      const customLayers = [
        { ...MockDataFactory.createLayer(), id: 'layer-1', displayTab: 'company' },
        { ...MockDataFactory.createLayer(), id: 'layer-2', displayTab: '1' },
        { ...MockDataFactory.createLayer(), id: 'layer-3', displayTab: '2' }
      ]

      // 会社タブ: 全て表示
      const companyTabData = FlowDataConverter.convertToFlowDataWithContainerFilter(
        mockCompanies,
        mockPositions,
        customLayers,
        mockBusinesses,
        mockTasks,
        mockExecutors,
        'company'
      )

      // Webサービス事業タブ: Web事業設定のみ
      const webTabData = FlowDataConverter.convertToFlowDataWithContainerFilter(
        mockCompanies,
        mockPositions,
        customLayers,
        mockBusinesses,
        mockTasks,
        mockExecutors,
        'business',
        '1'
      )

      // コンサルティング事業タブ: コンサル事業設定のみ
      const consultingTabData = FlowDataConverter.convertToFlowDataWithContainerFilter(
        mockCompanies,
        mockPositions,
        customLayers,
        mockBusinesses,
        mockTasks,
        mockExecutors,
        'business',
        '2'
      )

      const getLayerCount = (data) => data.nodes.filter(node => 
        node.type === 'business_layer' || node.type === 'cxo_layer'
      ).length

      // 会社タブでは最も多くのレイヤーが表示される
      expect(getLayerCount(companyTabData)).toBeGreaterThanOrEqual(getLayerCount(webTabData))
      expect(getLayerCount(companyTabData)).toBeGreaterThanOrEqual(getLayerCount(consultingTabData))

      // 事業タブでは該当事業のレイヤーのみ
      expect(getLayerCount(webTabData)).toBeLessThanOrEqual(1)
      expect(getLayerCount(consultingTabData)).toBeLessThanOrEqual(1)
    })
  })

  describe('パフォーマンス要件', () => {
    it('NFR-1.1: フィルタリング処理が50ms以内に完了する', () => {
      const largeDataSet = {
        companies: Array(10).fill(0).map((_, i) => MockDataFactory.createCompany({ id: `comp-${i}` })),
        positions: Array(20).fill(0).map((_, i) => MockDataFactory.createPosition({ id: `pos-${i}` })),
        layers: Array(50).fill(0).map((_, i) => ({ 
          ...MockDataFactory.createLayer(), 
          id: `layer-${i}`,
          displayTab: i % 3 === 0 ? 'company' : `${(i % 2) + 1}`
        })),
        businesses: mockBusinesses,
        tasks: mockTasks,
        executors: mockExecutors
      }

      const startTime = performance.now()

      FlowDataConverter.convertToFlowDataWithContainerFilter(
        largeDataSet.companies,
        largeDataSet.positions,
        largeDataSet.layers,
        largeDataSet.businesses,
        largeDataSet.tasks,
        largeDataSet.executors,
        'business',
        '1'
      )

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(50)
    })
  })

  describe('エラーハンドリング', () => {
    it('不正なdisplayTab値でも処理が継続される', () => {
      const invalidLayers = [
        { ...MockDataFactory.createLayer(), id: 'layer-1', displayTab: 'invalid-tab' },
        { ...MockDataFactory.createLayer(), id: 'layer-2', displayTab: null },
        { ...MockDataFactory.createLayer(), id: 'layer-3' } // displayTab未定義
      ]

      expect(() => {
        FlowDataConverter.convertToFlowDataWithContainerFilter(
          mockCompanies,
          mockPositions,
          invalidLayers,
          mockBusinesses,
          mockTasks,
          mockExecutors,
          'business',
          '1'
        )
      }).not.toThrow()
    })

    it('displayTabが未定義の場合はデフォルトで会社として扱われる', () => {
      const layerWithoutDisplayTab = { 
        ...MockDataFactory.createLayer(), 
        id: 'layer-undefined'
        // displayTab未定義
      }

      // 会社タブでは表示される
      const companyResult = FlowDataConverter.shouldShowContainer(layerWithoutDisplayTab, 'company')
      expect(companyResult).toBe(true)

      // 事業タブでは表示されない（デフォルトは会社設定として扱われる）
      const businessResult = FlowDataConverter.shouldShowContainer(layerWithoutDisplayTab, '1')
      expect(businessResult).toBe(false)
    })
  })
})