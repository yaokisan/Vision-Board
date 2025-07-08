'use client'

/**
 * メンバー管理メインコンポーネント
 * TDD実装：テストケースを満たす機能を実装
 */

import { useState, useEffect } from 'react'
import { Member, CreateMemberRequest } from '@/types'
import { MemberDAO } from '@/lib/member/MemberDAO'
import { MemberService } from '@/lib/member/MemberService'
import { PermissionService } from '@/lib/member/PermissionService'
import { MemberCard } from './MemberCard'
import { MemberForm } from './MemberForm'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { MemberFilters } from './MemberFilters'

interface MemberManagementProps {
  currentUser: Member
}

export function MemberManagement({ currentUser }: MemberManagementProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState<Member | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [permissionFilter, setPermissionFilter] = useState<string>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 権限チェック
  const canManage = PermissionService.canManageMembers(currentUser)

  // メンバー一覧の取得
  useEffect(() => {
    loadMembers()
  }, [currentUser.company_id])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const memberList = await MemberDAO.getMembersByCompany(currentUser.company_id)
      setMembers(memberList)
    } catch (error) {
      console.error('メンバー取得エラー:', error)
      setMessage({ type: 'error', text: 'メンバー情報の取得に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  // フィルタリングされたメンバー
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesPermission = permissionFilter === 'all' || member.permission === permissionFilter
    return matchesSearch && matchesPermission
  })

  // 新規メンバー追加
  const handleAddMember = async (memberData: CreateMemberRequest) => {
    try {
      const result = memberData.member_type === 'core' 
        ? await MemberService.addCoreMember(memberData)
        : await MemberService.addBusinessMember(memberData)

      if (result.success && result.member) {
        setMembers(prev => [...prev, result.member!])
        setShowAddForm(false)
        setMessage({ type: 'success', text: 'メンバーを追加しました' })
      } else {
        setMessage({ type: 'error', text: 'メンバーの追加に失敗しました' })
      }
    } catch (error) {
      console.error('メンバー追加エラー:', error)
      setMessage({ type: 'error', text: 'メンバーの追加に失敗しました' })
    }
  }

  // メンバー編集
  const handleEditMember = async (memberId: string, updates: { permission?: string; member_type?: string }) => {
    try {
      if (updates.permission) {
        const result = await MemberService.updatePermission(memberId, updates.permission)
        if (result.success && result.member) {
          setMembers(prev => prev.map(m => m.id === memberId ? result.member! : m))
          setEditingMember(null)
          setMessage({ type: 'success', text: 'メンバー情報を更新しました' })
        } else {
          setMessage({ type: 'error', text: 'メンバー情報の更新に失敗しました' })
        }
      }
    } catch (error) {
      console.error('メンバー更新エラー:', error)
      setMessage({ type: 'error', text: 'メンバー情報の更新に失敗しました' })
    }
  }

  // メンバー削除
  const handleDeleteMember = async (member: Member) => {
    try {
      const warning = await MemberService.getDeletionWarning(member.id)
      setDeletingMember(member)
      // DeleteConfirmDialogで warning を表示
    } catch (error) {
      console.error('削除確認エラー:', error)
      setMessage({ type: 'error', text: '削除確認の取得に失敗しました' })
    }
  }

  const confirmDeleteMember = async (memberId: string) => {
    try {
      const result = await MemberService.confirmDeleteMember(memberId)
      if (result.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
        setDeletingMember(null)
        setMessage({ type: 'success', text: 'メンバーを削除しました' })
      } else {
        setMessage({ type: 'error', text: 'メンバーの削除に失敗しました' })
      }
    } catch (error) {
      console.error('メンバー削除エラー:', error)
      setMessage({ type: 'error', text: 'メンバーの削除に失敗しました' })
    }
  }

  // メッセージの自動非表示
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 一時的に権限チェックを無効化
  // if (!canManage) {
  //   return (
  //     <div className="p-6 bg-white rounded-lg shadow">
  //       <div className="text-center text-gray-500">
  //         <h2 className="text-xl font-bold mb-4">メンバー管理</h2>
  //         <p>メンバー管理の権限がありません</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">メンバー管理</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            新規メンバー追加
          </button>
        </div>
      </div>

      {/* フィルター・検索 */}
      <MemberFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        permissionFilter={permissionFilter}
        onPermissionFilterChange={setPermissionFilter}
      />

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* メンバー一覧 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || permissionFilter !== 'all' 
                ? '条件に一致するメンバーが見つかりません'
                : 'メンバーがいません'
              }
            </div>
          ) : (
            filteredMembers.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                currentUser={currentUser}
                onEdit={() => setEditingMember(member)}
                onDelete={() => handleDeleteMember(member)}
              />
            ))
          )}
        </div>
      )}

      {/* 新規追加フォーム */}
      {showAddForm && (
        <MemberForm
          mode="add"
          companyId={currentUser.company_id}
          onSubmit={handleAddMember}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 編集フォーム */}
      {editingMember && (
        <MemberForm
          mode="edit"
          member={editingMember}
          companyId={currentUser.company_id}
          onSubmit={(data) => handleEditMember(editingMember.id, data)}
          onCancel={() => setEditingMember(null)}
        />
      )}

      {/* 削除確認ダイアログ */}
      {deletingMember && (
        <DeleteConfirmDialog
          member={deletingMember}
          onConfirm={() => confirmDeleteMember(deletingMember.id)}
          onCancel={() => setDeletingMember(null)}
        />
      )}
    </div>
  )
}