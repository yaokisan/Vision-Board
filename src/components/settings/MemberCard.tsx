'use client'

/**
 * メンバーカードコンポーネント
 * 個別メンバーの表示と操作ボタン
 */

import { Member } from '@/types'
import { PermissionService } from '@/lib/member/PermissionService'

interface MemberCardProps {
  member: Member
  currentUser: Member
  onEdit: () => void
  onDelete: () => void
}

export function MemberCard({ member, currentUser, onEdit, onDelete }: MemberCardProps) {
  // 権限の表示名
  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'admin': return '管理者'
      case 'viewer': return '閲覧者'
      case 'restricted': return '制限ユーザー'
      default: return permission
    }
  }

  // メンバータイプの表示名
  const getMemberTypeLabel = (memberType: string) => {
    switch (memberType) {
      case 'core': return 'コアメンバー'
      case 'business': return '事業メンバー'
      default: return memberType
    }
  }

  // 操作権限のチェック
  const canModify = PermissionService.canModifyMember(currentUser, member)

  return (
    <div
      data-testid="member-card"
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {/* メンバー情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          {/* 名前 */}
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {member.name}
          </h3>

          {/* バッジ */}
          <div className="flex flex-wrap gap-2">
            {/* 権限バッジ */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              member.permission === 'admin' 
                ? 'bg-red-100 text-red-800'
                : member.permission === 'viewer'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {getPermissionLabel(member.permission)}
            </span>

            {/* メンバータイプバッジ */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              member.member_type === 'core'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {getMemberTypeLabel(member.member_type)}
            </span>
          </div>
        </div>

        {/* メールアドレス */}
        <p className="mt-1 text-sm text-gray-500 truncate">
          {member.email}
        </p>

        {/* 作成日時 */}
        <p className="mt-1 text-xs text-gray-400">
          作成日: {new Date(member.created_at).toLocaleDateString('ja-JP')}
        </p>
      </div>

      {/* 操作ボタン */}
      <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4">
        {canModify.canEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
          >
            編集
          </button>
        )}

        {canModify.canDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
          >
            削除
          </button>
        )}

        {!canModify.canEdit && !canModify.canDelete && canModify.reason && (
          <span className="text-xs text-gray-400" title={canModify.reason}>
            操作不可
          </span>
        )}
      </div>
    </div>
  )
}