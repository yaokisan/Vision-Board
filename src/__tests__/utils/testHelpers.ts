import { Company, Position, Layer, Business, Task, Executor } from '@/types'

/**
 * テスト用のモックデータファクトリー
 */
export class MockDataFactory {
  static createCompany(overrides: Partial<Company> = {}): Company {
    return {
      id: 'test-company-1',
      name: 'テスト株式会社',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  static createPosition(overrides: Partial<Position> = {}): Position {
    return {
      id: 'test-position-1',
      company_id: 'test-company-1',
      name: 'CTO',
      person_name: '技術責任者',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  static createLayer(overrides: Partial<Layer> = {}): Layer {
    return {
      id: 'test-layer-1',
      company_id: 'test-company-1',
      name: '事業',
      type: 'business',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  static createBusiness(overrides: Partial<Business> = {}): Business {
    return {
      id: 'test-business-1',
      layer_id: 'test-layer-1',
      name: 'テスト事業',
      goal: 'テスト目標',
      responsible_person: 'テスト責任者',
      category: 'test',
      position_x: 100,
      position_y: 200,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  static createTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'test-task-1',
      business_id: 'test-business-1',
      layer_id: 'test-layer-1',
      name: 'テスト業務',
      goal: 'テスト業務目標',
      responsible_person: 'テスト業務責任者',
      group_name: 'test-group',
      position_x: 150,
      position_y: 300,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  static createExecutor(overrides: Partial<Executor> = {}): Executor {
    return {
      id: 'test-executor-1',
      task_id: 'test-task-1',
      name: 'テスト実行者',
      role: 'テスト役割',
      position_x: 200,
      position_y: 400,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      ...overrides
    }
  }

  /**
   * 完全なテストデータセットを作成
   */
  static createFullDataSet() {
    const companies = [this.createCompany()]
    const positions = [
      this.createPosition({ name: 'CEO', person_name: '代表取締役' }),
      this.createPosition({ id: 'test-position-2', name: 'CTO', person_name: '技術責任者' })
    ]
    const layers = [this.createLayer()]
    const businesses = [
      this.createBusiness({ id: 'web-biz', name: 'Webサービス事業' }),
      this.createBusiness({ id: 'consulting-biz', name: 'コンサルティング事業', position_x: 300 })
    ]
    const tasks = [
      this.createTask({ id: 'web-task', business_id: 'web-biz', name: 'Web開発業務' }),
      this.createTask({ id: 'consulting-task', business_id: 'consulting-biz', name: '営業業務', position_x: 350 })
    ]
    const executors = [
      this.createExecutor({ id: 'web-executor', task_id: 'web-task', name: 'Web開発者' }),
      this.createExecutor({ id: 'consulting-executor', task_id: 'consulting-task', name: '営業担当', position_x: 400 })
    ]

    return { companies, positions, layers, businesses, tasks, executors }
  }
}

/**
 * ノード位置のテストユーティリティ
 */
export class NodePositionTestHelper {
  /**
   * ノード位置データを作成
   */
  static createNodePositions(nodeId: string, x: number, y: number) {
    return {
      [nodeId]: { x, y }
    }
  }

  /**
   * 複数ノードの位置データを作成
   */
  static createMultipleNodePositions(positions: Array<{ nodeId: string; x: number; y: number }>) {
    return positions.reduce((acc, { nodeId, x, y }) => {
      acc[nodeId] = { x, y }
      return acc
    }, {} as Record<string, { x: number; y: number }>)
  }

  /**
   * 位置が期待値と一致するかチェック
   */
  static expectPositionToMatch(
    actual: { x: number; y: number } | undefined,
    expected: { x: number; y: number }
  ) {
    expect(actual).toBeDefined()
    expect(actual!.x).toBe(expected.x)
    expect(actual!.y).toBe(expected.y)
  }
}

/**
 * テスト用のアサーションヘルパー
 */
export class TestAssertions {
  /**
   * ノード配列に特定のIDが含まれているかチェック
   */
  static expectNodesToContain(nodes: Array<{ id: string }>, expectedIds: string[]) {
    const nodeIds = nodes.map(node => node.id)
    expectedIds.forEach(id => {
      expect(nodeIds).toContain(id)
    })
  }

  /**
   * ノード配列に特定のIDが含まれていないかチェック
   */
  static expectNodesToNotContain(nodes: Array<{ id: string }>, excludedIds: string[]) {
    const nodeIds = nodes.map(node => node.id)
    excludedIds.forEach(id => {
      expect(nodeIds).not.toContain(id)
    })
  }

  /**
   * 特定のタイプのノードが期待数だけ含まれているかチェック
   */
  static expectNodeTypeCount(nodes: Array<{ type: string }>, type: string, expectedCount: number) {
    const nodeCount = nodes.filter(node => node.type === type).length
    expect(nodeCount).toBe(expectedCount)
  }
}

/**
 * パフォーマンステスト用のユーティリティ
 */
export class PerformanceTestHelper {
  /**
   * 実行時間を測定してアサーション
   */
  static async expectExecutionTime<T>(
    fn: () => T | Promise<T>,
    maxTimeMs: number
  ): Promise<T> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    const executionTime = endTime - startTime
    
    expect(executionTime).toBeLessThan(maxTimeMs)
    return result
  }

  /**
   * メモリ使用量の簡易測定（ブラウザ環境での近似）
   */
  static getApproximateMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0 // Node.js環境では0を返す
  }
}

// テストヘルパーのテスト
describe('TestHelpers', () => {
  it('MockDataFactory should create valid data', () => {
    const company = MockDataFactory.createCompany()
    expect(company.id).toBeDefined()
    expect(company.name).toBeDefined()
  })
})