/**
 * MemberSelector コンポーネントのテスト
 * TDD実装：組織図でのメンバー選択機能
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemberSelector } from '@/components/flow/MemberSelector'
import { Member } from '@/types'

// テスト用のモックメンバーデータ
const mockMembers: Member[] = [
  {
    id: '1',
    company_id: 'company-1',
    name: '田中太郎',
    email: 'tanaka@empire-art.com',
    permission: 'admin',
    member_type: 'core',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    company_id: 'company-1',
    name: '佐藤花子',
    email: 'sato@empire-art.com',
    permission: 'viewer',
    member_type: 'core',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    company_id: 'company-1',
    name: '鈴木一郎',
    email: 'suzuki@empire-art.com',
    permission: 'restricted',
    member_type: 'business',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const defaultProps = {
  members: mockMembers,
  selectedMemberId: null,
  onSelect: jest.fn(),
  placeholder: 'メンバーを選択...'
}

describe('MemberSelector コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TC-1: 基本表示', () => {
    it('ドロップダウンが表示される', () => {
      render(<MemberSelector {...defaultProps} />)
      
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('メンバーを選択...')).toBeInTheDocument()
    })

    it('未選択オプションが表示される', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} />)
      
      await user.click(screen.getByRole('combobox'))
      
      expect(screen.getByText('未選択')).toBeInTheDocument()
    })

    it('メンバーリストが表示される', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} />)
      
      await user.click(screen.getByRole('combobox'))
      
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      expect(screen.getByText('鈴木一郎')).toBeInTheDocument()
    })
  })

  describe('TC-2: メンバー選択機能', () => {
    it('メンバーを選択できる', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      render(<MemberSelector {...defaultProps} onSelect={mockOnSelect} />)
      
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('田中太郎'))
      
      expect(mockOnSelect).toHaveBeenCalledWith('1')
    })

    it('未選択を選択できる', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      render(<MemberSelector {...defaultProps} onSelect={mockOnSelect} />)
      
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('未選択'))
      
      expect(mockOnSelect).toHaveBeenCalledWith(null)
    })

    it('選択されたメンバーが表示される', () => {
      render(<MemberSelector {...defaultProps} selectedMemberId="1" />)
      
      expect(screen.getByDisplayValue('田中太郎')).toBeInTheDocument()
    })
  })

  describe('TC-3: 検索機能', () => {
    it('メンバー名で検索できる', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} searchable={true} />)
      
      await user.click(screen.getByRole('combobox'))
      const searchInput = screen.getByPlaceholderText('メンバーを検索...')
      await user.type(searchInput, '田中')
      
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.queryByText('佐藤花子')).not.toBeInTheDocument()
    })

    it('検索結果がない場合のメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} searchable={true} />)
      
      await user.click(screen.getByRole('combobox'))
      const searchInput = screen.getByPlaceholderText('メンバーを検索...')
      await user.type(searchInput, '存在しない名前')
      
      expect(screen.getByText('該当するメンバーが見つかりません')).toBeInTheDocument()
    })
  })

  describe('TC-4: 権限制御', () => {
    it('制限されたメンバーリストが表示される', async () => {
      const user = userEvent.setup()
      const restrictedMembers = mockMembers.slice(0, 2) // 最初の2人のみ
      render(<MemberSelector {...defaultProps} members={restrictedMembers} />)
      
      await user.click(screen.getByRole('combobox'))
      
      expect(screen.getByText('田中太郎')).toBeInTheDocument()
      expect(screen.getByText('佐藤花子')).toBeInTheDocument()
      expect(screen.queryByText('鈴木一郎')).not.toBeInTheDocument()
    })
  })

  describe('TC-5: 無効化状態', () => {
    it('無効化されたセレクターが表示される', () => {
      render(<MemberSelector {...defaultProps} disabled={true} />)
      
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('無効化時はドロップダウンが開かない', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} disabled={true} />)
      
      await user.click(screen.getByRole('combobox'))
      
      expect(screen.queryByText('田中太郎')).not.toBeInTheDocument()
    })
  })

  describe('TC-6: エラーハンドリング', () => {
    it('空のメンバーリストでも正常に表示される', async () => {
      const user = userEvent.setup()
      render(<MemberSelector {...defaultProps} members={[]} />)
      
      await user.click(screen.getByRole('combobox'))
      
      expect(screen.getByText('未選択')).toBeInTheDocument()
      expect(screen.getByText('利用可能なメンバーがいません')).toBeInTheDocument()
    })

    it('ローディング状態が表示される', () => {
      render(<MemberSelector {...defaultProps} loading={true} />)
      
      expect(screen.getByText('読み込み中...')).toBeInTheDocument()
    })
  })

  describe('TC-7: アクセシビリティ', () => {
    it('キーボードナビゲーションができる', async () => {
      const user = userEvent.setup()
      const mockOnSelect = jest.fn()
      render(<MemberSelector {...defaultProps} onSelect={mockOnSelect} />)
      
      // Enterキーでドロップダウンを開く
      await user.tab()
      await user.keyboard('{Enter}')
      
      // 矢印キーで選択
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(mockOnSelect).toHaveBeenCalled()
    })

    it('適切なARIA属性が設定されている', () => {
      render(<MemberSelector {...defaultProps} />)
      
      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveAttribute('aria-expanded', 'false')
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox')
    })
  })
})