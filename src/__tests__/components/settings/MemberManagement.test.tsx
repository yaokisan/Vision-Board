/**
 * メンバー管理画面 UIテスト
 * TDD: 要件定義からテストケースを先行作成
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberManagement } from '@/components/settings/MemberManagement'
import { MemberService } from '@/lib/member/MemberService'
import { PermissionService } from '@/lib/member/PermissionService'

// モック
jest.mock('@/lib/member/MemberService')
jest.mock('@/lib/member/PermissionService')

const mockMemberService = MemberService as jest.Mocked<typeof MemberService>
const mockPermissionService = PermissionService as jest.Mocked<typeof PermissionService>

// テスト用データ
const mockCompanyId = 'test-company-id'
const mockCurrentUser = {
  id: 'current-user-id',
  company_id: mockCompanyId,
  name: '管理者太郎',
  email: 'admin@example.com',
  permission: 'admin' as const,
  member_type: 'core' as const,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

const mockMembers = [
  {
    id: 'member-1',
    company_id: mockCompanyId,
    name: '田中太郎',
    email: 'tanaka@example.com',
    permission: 'admin' as const,
    member_type: 'core' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'member-2',
    company_id: mockCompanyId,
    name: '佐藤花子',
    email: 'sato@example.com',
    permission: 'viewer' as const,
    member_type: 'core' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: 'member-3',
    company_id: mockCompanyId,
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    permission: 'restricted' as const,
    member_type: 'business' as const,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
]

describe('MemberManagement コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのモック設定
    mockPermissionService.canManageMembers.mockReturnValue(true)
    
    // getMembersByCompany のモック
    jest.spyOn(require('@/lib/member/MemberDAO'), 'MemberDAO').mockImplementation(() => ({
      getMembersByCompany: jest.fn().mockResolvedValue(mockMembers)
    }))
  })

  describe('TC-1: 初期表示', () => {
    it('メンバー一覧が表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      // ローディング表示の確認
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
      
      // メンバー一覧の表示を待つ
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      expect(screen.getByText('鈴木一郎')).toBeInTheDocument()
    })

    it('メンバー情報が正しく表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      // 各メンバーの詳細情報
      expect(screen.getByText('tanaka@example.com')).toBeInTheDocument()
      expect(screen.getByText('管理者')).toBeInTheDocument() // admin
      expect(screen.getByText('コアメンバー')).toBeInTheDocument() // core
      
      expect(screen.getByText('sato@example.com')).toBeInTheDocument()
      expect(screen.getByText('閲覧者')).toBeInTheDocument() // viewer
      
      expect(screen.getByText('suzuki@example.com')).toBeInTheDocument()
      expect(screen.getByText('制限ユーザー')).toBeInTheDocument() // restricted
      expect(screen.getByText('事業メンバー')).toBeInTheDocument() // business
    })

    it('権限がない場合はアクセス拒否メッセージが表示される', () => {
      mockPermissionService.canManageMembers.mockReturnValue(false)
      
      render(<MemberManagement currentUser={{ ...mockCurrentUser, permission: 'viewer' }} />)
      
      expect(screen.getByText('メンバー管理の権限がありません')).toBeInTheDocument()
      expect(screen.queryByText('新規メンバー追加')).not.toBeInTheDocument()
    })
  })

  describe('TC-2: 新規メンバー追加', () => {
    it('新規メンバー追加ボタンが表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('新規メンバー追加')).toBeInTheDocument()
      })
    })

    it('新規メンバー追加フォームが開く', async () => {
      const user = userEvent.setup()
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('新規メンバー追加')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('新規メンバー追加'))
      
      // フォームの表示確認
      expect(screen.getByLabelText('名前')).toBeInTheDocument()
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
      expect(screen.getByLabelText('権限')).toBeInTheDocument()
      expect(screen.getByLabelText('メンバータイプ')).toBeInTheDocument()
      expect(screen.getByText('追加')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('フォーム入力と送信ができる', async () => {
      const user = userEvent.setup()
      mockMemberService.addBusinessMember.mockResolvedValue({
        success: true,
        member: {
          id: 'new-member-id',
          company_id: mockCompanyId,
          name: '新規メンバー',
          email: 'new@example.com',
          permission: 'viewer',
          member_type: 'business',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        assigned_businesses: []
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      // フォームを開く
      await waitFor(() => {
        expect(screen.getByText('新規メンバー追加')).toBeInTheDocument()
      })
      await user.click(screen.getByText('新規メンバー追加'))
      
      // フォーム入力
      await user.type(screen.getByLabelText('名前'), '新規メンバー')
      await user.type(screen.getByLabelText('メールアドレス'), 'new@example.com')
      await user.selectOptions(screen.getByLabelText('権限'), 'viewer')
      await user.selectOptions(screen.getByLabelText('メンバータイプ'), 'business')
      
      // 送信
      await user.click(screen.getByText('追加'))
      
      // サービス呼び出しの確認
      await waitFor(() => {
        expect(mockMemberService.addBusinessMember).toHaveBeenCalledWith({
          name: '新規メンバー',
          email: 'new@example.com',
          permission: 'viewer',
          member_type: 'business',
          company_id: mockCompanyId
        })
      })
      
      // 成功メッセージの表示
      expect(screen.getByText('メンバーを追加しました')).toBeInTheDocument()
    })

    it('バリデーションエラーが表示される', async () => {
      const user = userEvent.setup()
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('新規メンバー追加')).toBeInTheDocument()
      })
      await user.click(screen.getByText('新規メンバー追加'))
      
      // 空のフォームで送信
      await user.click(screen.getByText('追加'))
      
      // バリデーションエラーの確認
      expect(screen.getByText('名前は必須です')).toBeInTheDocument()
      expect(screen.getByText('メールアドレスは必須です')).toBeInTheDocument()
    })

    it('重複メールアドレスのエラーが表示される', async () => {
      const user = userEvent.setup()
      mockMemberService.addBusinessMember.mockResolvedValue({
        success: false,
        error: 'このメールアドレスは既に使用されています'
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('新規メンバー追加')).toBeInTheDocument()
      })
      await user.click(screen.getByText('新規メンバー追加'))
      
      await user.type(screen.getByLabelText('名前'), '重複メンバー')
      await user.type(screen.getByLabelText('メールアドレス'), 'tanaka@example.com') // 既存メール
      await user.selectOptions(screen.getByLabelText('権限'), 'viewer')
      await user.selectOptions(screen.getByLabelText('メンバータイプ'), 'business')
      
      await user.click(screen.getByText('追加'))
      
      await waitFor(() => {
        expect(screen.getByText('このメールアドレスは既に使用されています')).toBeInTheDocument()
      })
    })
  })

  describe('TC-3: メンバー編集', () => {
    it('編集ボタンが各メンバーに表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByText('編集')
      expect(editButtons).toHaveLength(3) // 3人のメンバー
    })

    it('編集フォームが開く', async () => {
      const user = userEvent.setup()
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByText('編集')
      await user.click(editButtons[0]) // 最初のメンバーを編集
      
      // 編集フォームの確認
      expect(screen.getByDisplayValue('田中太郎')).toBeInTheDocument()
      expect(screen.getByDisplayValue('tanaka@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('admin')).toBeInTheDocument()
      expect(screen.getByText('保存')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('メンバー情報を更新できる', async () => {
      const user = userEvent.setup()
      mockMemberService.updatePermission.mockResolvedValue({
        success: true,
        member: { ...mockMembers[0], permission: 'viewer' },
        requires_reload: false
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const editButtons = screen.getAllByText('編集')
      await user.click(editButtons[0])
      
      // 権限を変更
      await user.selectOptions(screen.getByDisplayValue('admin'), 'viewer')
      await user.click(screen.getByText('保存'))
      
      await waitFor(() => {
        expect(mockMemberService.updatePermission).toHaveBeenCalledWith('member-1', 'viewer')
      })
      
      expect(screen.getByText('メンバー情報を更新しました')).toBeInTheDocument()
    })
  })

  describe('TC-4: メンバー削除', () => {
    it('削除ボタンが表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByText('削除')
      expect(deleteButtons).toHaveLength(3)
    })

    it('削除確認ダイアログが表示される', async () => {
      const user = userEvent.setup()
      mockMemberService.getDeletionWarning.mockResolvedValue({
        hasOrganizationRoles: false,
        affectedRoles: []
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByText('削除')
      await user.click(deleteButtons[1]) // 2番目のメンバーを削除
      
      expect(screen.getByText('メンバーを削除しますか？')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子を削除しますか？この操作は取り消せません。')).toBeInTheDocument()
      expect(screen.getByText('削除する')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })

    it('組織図で使用中の場合は警告が表示される', async () => {
      const user = userEvent.setup()
      mockMemberService.getDeletionWarning.mockResolvedValue({
        hasOrganizationRoles: true,
        affectedRoles: [
          { role_type: 'position', reference_name: 'CEO' },
          { role_type: 'business_manager', reference_name: 'Webサービス事業' }
        ]
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByText('削除')
      await user.click(deleteButtons[0])
      
      expect(screen.getByText('⚠️ 組織図で使用中')).toBeInTheDocument()
      expect(screen.getByText('このメンバーは以下の役割に割り当てられています：')).toBeInTheDocument()
      expect(screen.getByText('CEO')).toBeInTheDocument()
      expect(screen.getByText('Webサービス事業 責任者')).toBeInTheDocument()
      expect(screen.getByText('削除すると、これらの役割が空欄になります。')).toBeInTheDocument()
    })

    it('削除が実行される', async () => {
      const user = userEvent.setup()
      mockMemberService.getDeletionWarning.mockResolvedValue({
        hasOrganizationRoles: false,
        affectedRoles: []
      })
      mockMemberService.confirmDeleteMember.mockResolvedValue({
        success: true,
        requires_reload: false
      })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const deleteButtons = screen.getAllByText('削除')
      await user.click(deleteButtons[1])
      
      await user.click(screen.getByText('削除する'))
      
      await waitFor(() => {
        expect(mockMemberService.confirmDeleteMember).toHaveBeenCalledWith('member-2')
      })
      
      expect(screen.getByText('メンバーを削除しました')).toBeInTheDocument()
    })
  })

  describe('TC-5: フィルタリング・検索', () => {
    it('検索ボックスが表示される', async () => {
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      expect(screen.getByPlaceholderText('メンバーを検索...')).toBeInTheDocument()
    })

    it('名前で検索できる', async () => {
      const user = userEvent.setup()
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const searchBox = screen.getByPlaceholderText('メンバーを検索...')
      await user.type(searchBox, '田中')
      
      // 田中太郎のみ表示される
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
      expect(screen.queryByText('鈴木一郎')).not.toBeInTheDocument()
    })

    it('権限でフィルタリングできる', async () => {
      const user = userEvent.setup()
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      const filterSelect = screen.getByDisplayValue('すべて')
      await user.selectOptions(filterSelect, 'admin')
      
      // 管理者のみ表示される
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
      expect(screen.queryByText('鈴木一郎')).not.toBeInTheDocument()
    })
  })

  describe('TC-6: レスポンシブデザイン', () => {
    it('モバイル表示で適切にレイアウトされる', async () => {
      // ビューポートをモバイルサイズに設定
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 })
      
      render(<MemberManagement currentUser={mockCurrentUser} />)
      
      await waitFor(() => {
        expect(screen.getByText('田中太郎')).toBeInTheDocument()
      })
      
      // モバイル用のカードレイアウトが適用されているかを確認
      const memberCards = screen.getAllByTestId('member-card')
      expect(memberCards[0]).toHaveClass('flex-col') // 縦方向レイアウト
    })
  })
})