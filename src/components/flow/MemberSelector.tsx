'use client'

/**
 * MemberSelector コンポーネント
 * 組織図でのメンバー選択用ドロップダウン
 */

import { useState, useRef, useEffect } from 'react'
import { Member } from '@/types'

interface MemberSelectorProps {
  members: Member[]
  selectedMemberId: string | null
  onSelect: (memberId: string | null) => void
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function MemberSelector({
  members,
  selectedMemberId,
  onSelect,
  placeholder = 'メンバーを選択...',
  searchable = false,
  disabled = false,
  loading = false,
  className = ''
}: MemberSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 選択されたメンバーを取得
  const selectedMember = members.find(m => m.id === selectedMemberId) || null

  // 検索でフィルタリングされたメンバー
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ドロップダウンが開いたときに検索入力にフォーカス
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          setIsOpen(true)
          e.preventDefault()
        } else if (focusedIndex === -1) {
          // 未選択を選択
          onSelect(null)
          setIsOpen(false)
          e.preventDefault()
        } else if (focusedIndex >= 0 && focusedIndex < filteredMembers.length) {
          onSelect(filteredMembers[focusedIndex].id)
          setIsOpen(false)
          e.preventDefault()
        }
        break
      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev => 
            prev < filteredMembers.length - 1 ? prev + 1 : -1
          )
        }
        e.preventDefault()
        break
      case 'ArrowUp':
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > -1 ? prev - 1 : filteredMembers.length - 1
          )
        }
        e.preventDefault()
        break
      case 'Escape':
        setIsOpen(false)
        setSearchTerm('')
        setFocusedIndex(-1)
        break
    }
  }

  // メンバー選択ハンドラー
  const handleMemberSelect = (memberId: string | null) => {
    onSelect(memberId)
    setIsOpen(false)
    setSearchTerm('')
    setFocusedIndex(-1)
  }

  // ドロップダウントグル
  const toggleDropdown = () => {
    if (disabled || loading) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
      setFocusedIndex(-1)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* メインボタン */}
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        disabled={disabled || loading}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left
          border border-gray-300 rounded-md bg-white text-sm
          ${disabled || loading 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}
        `}
      >
        <span className={selectedMember ? 'text-gray-900' : 'text-gray-500'}>
          {loading 
            ? '読み込み中...' 
            : selectedMember?.name || placeholder
          }
        </span>
        
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* 検索ボックス */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="メンバーを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <ul role="listbox" className="py-1">
            {/* 未選択オプション */}
            <li
              role="option"
              aria-selected={selectedMemberId === null && focusedIndex === -1}
              onClick={() => handleMemberSelect(null)}
              className={`
                px-3 py-2 text-sm cursor-pointer
                ${focusedIndex === -1 
                  ? 'bg-blue-50 text-blue-900' 
                  : 'text-gray-700 hover:bg-gray-50'
                }
                ${selectedMemberId === null ? 'font-medium' : ''}
              `}
            >
              未選択
            </li>

            {/* メンバーリスト */}
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member, index) => (
                <li
                  key={member.id}
                  role="option"
                  aria-selected={selectedMemberId === member.id}
                  onClick={() => handleMemberSelect(member.id)}
                  className={`
                    px-3 py-2 text-sm cursor-pointer flex flex-col
                    ${focusedIndex === index 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                    ${selectedMemberId === member.id ? 'font-medium' : ''}
                  `}
                >
                  <span>{member.name}</span>
                  <span className="text-xs text-gray-500">{member.email}</span>
                </li>
              ))
            ) : members.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">
                利用可能なメンバーがいません
              </li>
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">
                該当するメンバーが見つかりません
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}