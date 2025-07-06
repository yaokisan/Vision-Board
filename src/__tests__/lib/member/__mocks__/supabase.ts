/**
 * Supabaseクライアントのモック
 * テスト環境でのSupabase操作をシミュレート
 */

// モックデータ
const mockMembers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    name: '田中太郎',
    email: 'tanaka@empire-art.com',
    permission: 'admin',
    member_type: 'core',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    name: '佐藤花子',
    email: 'sato@empire-art.com',
    permission: 'admin',
    member_type: 'core',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

const mockBusinesses = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    layer_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Webサービス事業',
    goal: 'ユーザー数100万人達成',
    responsible_person_id: null,
    responsible_person: '田中太郎',
    category: 'デジタル',
    position_x: 100,
    position_y: 400,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

const mockPositions = [
  {
    id: '550e8400-e29b-41d4-a716-446655440030',
    company_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'CEO',
    member_id: '550e8400-e29b-41d4-a716-446655440020',
    person_name: '田中太郎',
    position_x: 0,
    position_y: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

const mockMemberBusinesses = [
  {
    id: '550e8400-e29b-41d4-a716-446655440040',
    member_id: '550e8400-e29b-41d4-a716-446655440020',
    business_id: '550e8400-e29b-41d4-a716-446655440010',
    created_at: '2023-01-01T00:00:00Z'
  }
]

// データストア（テスト中に変更される）
let membersData = [...mockMembers]
let businessesData = [...mockBusinesses]
let positionsData = [...mockPositions]
let memberBusinessesData = [...mockMemberBusinesses]
let memberRolesData: any[] = []

// リセット関数
export const resetMockData = () => {
  membersData = [...mockMembers]
  businessesData = [...mockBusinesses]
  positionsData = [...mockPositions]
  memberBusinessesData = [...mockMemberBusinesses]
  memberRolesData = []
}

// モッククエリビルダー
class MockQueryBuilder {
  private tableName: string
  private filters: any[] = []
  private selectFields = '*'
  private orderBy: { column: string; ascending: boolean } | null = null

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields = '*') {
    this.selectFields = fields
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending ?? true }
    return this
  }

  single() {
    return this.execute().then(result => {
      if (result.error) return result
      return {
        data: result.data?.[0] || null,
        error: result.data?.length === 0 ? { message: 'No rows found' } : null
      }
    })
  }

  async execute() {
    try {
      let data: any[] = []

      switch (this.tableName) {
        case 'members':
          data = [...membersData]
          break
        case 'businesses':
          data = [...businessesData]
          break
        case 'positions':
          data = [...positionsData]
          break
        case 'member_businesses':
          data = [...memberBusinessesData]
          if (this.selectFields.includes('members')) {
            data = data.map(mb => ({
              ...mb,
              members: membersData.find(m => m.id === mb.member_id)
            }))
          }
          break
        case 'member_roles':
          data = [...memberRolesData]
          break
        default:
          data = []
      }

      // フィルター適用
      this.filters.forEach(filter => {
        data = data.filter(item => {
          if (filter.operator === 'eq') {
            return item[filter.column] === filter.value
          }
          return true
        })
      })

      // ソート適用
      if (this.orderBy) {
        data.sort((a, b) => {
          const aVal = a[this.orderBy!.column]
          const bVal = b[this.orderBy!.column]
          const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          return this.orderBy!.ascending ? result : -result
        })
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // insert, update, delete メソッドも実装
  async insert(values: any | any[]) {
    const items = Array.isArray(values) ? values : [values]
    
    try {
      const newItems = items.map(item => ({
        id: item.id || `new-${Date.now()}-${Math.random()}`,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      switch (this.tableName) {
        case 'members':
          membersData.push(...newItems)
          break
        case 'member_businesses':
          memberBusinessesData.push(...newItems)
          break
        case 'member_roles':
          memberRolesData.push(...newItems)
          break
      }

      return { data: newItems, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async update(values: any) {
    try {
      let updatedItems: any[] = []

      switch (this.tableName) {
        case 'members':
          membersData = membersData.map(item => {
            const shouldUpdate = this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
            if (shouldUpdate) {
              const updated = { ...item, ...values, updated_at: new Date().toISOString() }
              updatedItems.push(updated)
              return updated
            }
            return item
          })
          break
        case 'businesses':
          businessesData = businessesData.map(item => {
            const shouldUpdate = this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
            if (shouldUpdate) {
              const updated = { ...item, ...values, updated_at: new Date().toISOString() }
              updatedItems.push(updated)
              return updated
            }
            return item
          })
          break
        case 'positions':
          positionsData = positionsData.map(item => {
            const shouldUpdate = this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
            if (shouldUpdate) {
              const updated = { ...item, ...values, updated_at: new Date().toISOString() }
              updatedItems.push(updated)
              return updated
            }
            return item
          })
          break
      }

      return { data: updatedItems, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async delete() {
    try {
      let deletedItems: any[] = []

      switch (this.tableName) {
        case 'members':
          const membersToDelete = membersData.filter(item =>
            this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          deletedItems = [...membersToDelete]
          membersData = membersData.filter(item =>
            !this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          break
        case 'member_businesses':
          const relationsToDelete = memberBusinessesData.filter(item =>
            this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          deletedItems = [...relationsToDelete]
          memberBusinessesData = memberBusinessesData.filter(item =>
            !this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          break
        case 'member_roles':
          const rolesToDelete = memberRolesData.filter(item =>
            this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          deletedItems = [...rolesToDelete]
          memberRolesData = memberRolesData.filter(item =>
            !this.filters.every(filter => 
              filter.operator === 'eq' && item[filter.column] === filter.value
            )
          )
          break
      }

      return { data: deletedItems, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// モックSupabaseクライアント
export const mockSupabase = {
  from: (tableName: string) => new MockQueryBuilder(tableName)
}

// モック関数をエクスポート
export { mockMembers, mockBusinesses, mockPositions, mockMemberBusinesses }