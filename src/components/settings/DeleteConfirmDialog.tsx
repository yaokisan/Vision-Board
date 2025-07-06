'use client'

/**
 * メンバー削除確認ダイアログ
 */

import { useState, useEffect } from 'react'
import { Member, MemberDeletionWarning } from '@/types'
import { MemberService } from '@/lib/member/MemberService'

interface DeleteConfirmDialogProps {
  member: Member
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ member, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const [warning, setWarning] = useState<MemberDeletionWarning | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWarning = async () => {
      try {
        const warningData = await MemberService.getDeletionWarning(member.id)
        setWarning(warningData)
      } catch (error) {
        console.error('削除警告取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadWarning()
  }, [member.id])

  const getRoleTypeLabel = (roleType: string) => {
    switch (roleType) {
      case 'position': return ''
      case 'business_manager': return ' 責任者'
      case 'task_manager': return ' 責任者'
      default: return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            メンバーを削除しますか？
          </h3>

          {loading ? (
            <div className="text-center py-4">
              <div className="text-gray-500">確認中...</div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">{member.name}</span>を削除しますか？この操作は取り消せません。
                </p>

                {warning?.hasOrganizationRoles && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start">
                      <div className="text-yellow-600 mr-2">⚠️</div>
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          組織図で使用中
                        </h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          このメンバーは以下の役割に割り当てられています：
                        </p>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {warning.affectedRoles.map((role, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                              {role.reference_name}{getRoleTypeLabel(role.role_type)}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-yellow-700 mt-3">
                          削除すると、これらの役割が空欄になります。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
                >
                  キャンセル
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
                >
                  削除する
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}