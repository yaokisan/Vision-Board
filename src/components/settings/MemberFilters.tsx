'use client'

/**
 * メンバーフィルター・検索コンポーネント
 */

interface MemberFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  permissionFilter: string
  onPermissionFilterChange: (permission: string) => void
}

export function MemberFilters({ 
  searchTerm, 
  onSearchChange, 
  permissionFilter, 
  onPermissionFilterChange 
}: MemberFiltersProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4">
      {/* 検索ボックス */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="メンバーを検索..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 権限フィルター */}
      <div className="sm:w-48">
        <select
          value={permissionFilter}
          onChange={(e) => onPermissionFilterChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">すべて</option>
          <option value="admin">管理者</option>
          <option value="viewer">閲覧者</option>
          <option value="restricted">制限ユーザー</option>
        </select>
      </div>
    </div>
  )
}