/**
 * Supabase-jsのモック
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

// データストア
let membersData = [...mockMembers]
let businessesData: any[] = []
let positionsData: any[] = []
let memberBusinessesData: any[] = []
let memberRolesData: any[] = []

// モッククエリビルダー
class MockQueryBuilder {
  private tableName: string
  private filters: any[] = []
  private selectFields = '*'

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

  order() {
    return this
  }

  async single() {
    const result = await this.execute()
    return {
      data: result.data?.[0] || null,
      error: result.data?.length === 0 ? { message: 'No rows found' } : null
    }
  }

  async execute() {
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
        break
      case 'member_roles':
        data = [...memberRolesData]
        break
    }

    // フィルター適用
    this.filters.forEach(filter => {
      if (filter.operator === 'eq') {
        data = data.filter(item => item[filter.column] === filter.value)
      }
    })

    return { data, error: null }
  }

  async insert(values: any) {
    const items = Array.isArray(values) ? values : [values]
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
  }

  async update(values: any) {
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
    }

    return { data: updatedItems, error: null }
  }

  async delete() {
    switch (this.tableName) {
      case 'members':
        membersData = membersData.filter(item =>
          !this.filters.every(filter => 
            filter.operator === 'eq' && item[filter.column] === filter.value
          )
        )
        break
      case 'member_businesses':
        memberBusinessesData = memberBusinessesData.filter(item =>
          !this.filters.every(filter => 
            filter.operator === 'eq' && item[filter.column] === filter.value
          )
        )
        break
      case 'member_roles':
        memberRolesData = memberRolesData.filter(item =>
          !this.filters.every(filter => 
            filter.operator === 'eq' && item[filter.column] === filter.value
          )
        )
        break
    }

    return { data: [], error: null }
  }
}

// モックSupabaseクライアント
const mockSupabaseClient = {
  from: (tableName: string) => new MockQueryBuilder(tableName)
}

// createClient関数をモック
export const createClient = () => mockSupabaseClient

export default { createClient }