/**
 * Phase 0 - P0-R1: 会社カード編集機能のテスト
 * TDD実装：失敗するテストケースを先に作成
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CompanyCard from '../CompanyCard'
import { Company, Member } from '@/types'

// テスト用のモックデータ
const mockCompany: Company = {
  id: 'test-company-1',
  name: 'テスト会社',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockMembers: Member[] = [
  {
    id: 'member-1',
    company_id: 'test-company-1',
    auth_user_id: 'auth-1',
    name: 'テストユーザー1',
    email: 'test1@example.com',
    permission: 'admin',
    member_type: 'core',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'member-2',
    company_id: 'test-company-1',
    auth_user_id: 'auth-2',
    name: 'テストユーザー2',
    email: 'test2@example.com',
    permission: 'viewer',
    member_type: 'core',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockCurrentUser: Member = mockMembers[0]

describe('CompanyCard - 編集機能', () => {
  const mockOnEdit = jest.fn()
  const mockOnUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // P0-R1-T1: 会社カード編集ボタン表示
  test('会社カードに編集ボタンが表示される', () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    expect(screen.getByTestId('company-edit-button')).toBeInTheDocument()
  })

  // P0-R1-T2: 編集モーダル開閉
  test('編集ボタンクリックで編集モーダルが開く', () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    const editButton = screen.getByTestId('company-edit-button')
    fireEvent.click(editButton)

    expect(screen.getByTestId('company-edit-modal')).toBeInTheDocument()
  })

  test('キャンセルボタンで編集モーダルが閉じる', () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    // モーダルを開く
    fireEvent.click(screen.getByTestId('company-edit-button'))
    expect(screen.getByTestId('company-edit-modal')).toBeInTheDocument()

    // キャンセルボタンをクリック
    fireEvent.click(screen.getByTestId('cancel-button'))
    expect(screen.queryByTestId('company-edit-modal')).not.toBeInTheDocument()
  })

  // P0-R1-T3: 会社名編集
  test('会社名を変更して保存できる', async () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    )

    // モーダルを開く
    fireEvent.click(screen.getByTestId('company-edit-button'))
    
    // 会社名を変更
    const companyNameInput = screen.getByTestId('company-name-input')
    fireEvent.change(companyNameInput, { target: { value: '新会社名' } })

    // 保存ボタンをクリック
    fireEvent.click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        companyName: '新会社名',
        ceoId: expect.any(String)
      })
    })
  })

  test('会社名が空の場合はエラー表示', async () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    // モーダルを開く
    fireEvent.click(screen.getByTestId('company-edit-button'))
    
    // 会社名を空にする
    const companyNameInput = screen.getByTestId('company-name-input')
    fireEvent.change(companyNameInput, { target: { value: '' } })

    // 保存ボタンをクリック
    fireEvent.click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(screen.getByTestId('company-name-error')).toBeInTheDocument()
    })
  })

  // P0-R1-T4: CEOメンバー選択
  test('CEOをメンバーリストから選択できる', async () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        onUpdate={mockOnUpdate}
        editable={true}
      />
    )

    // モーダルを開く
    fireEvent.click(screen.getByTestId('company-edit-button'))
    
    // CEOセレクターが表示されることを確認
    expect(screen.getByTestId('ceo-selector')).toBeInTheDocument()

    // メンバーを選択
    const ceoSelector = screen.getByTestId('ceo-selector')
    fireEvent.click(ceoSelector)
    
    // メンバーリストが表示されることを確認
    expect(screen.getByText('テストユーザー1')).toBeInTheDocument()
    expect(screen.getByText('テストユーザー2')).toBeInTheDocument()

    // メンバーを選択
    fireEvent.click(screen.getByText('テストユーザー2'))

    // 保存ボタンをクリック
    fireEvent.click(screen.getByTestId('save-button'))

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith({
        companyName: 'テスト会社',
        ceoId: 'member-2'
      })
    })
  })

  test('選択したCEOがカードに反映される', async () => {
    const { rerender } = render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    // CEO名が更新されたときの再レンダリング
    rerender(
      <CompanyCard 
        company={mockCompany}
        ceoName="テストユーザー2"
        members={mockMembers}
        currentUser={mockCurrentUser}
        onEdit={mockOnEdit}
        editable={true}
      />
    )

    expect(screen.getByText('テストユーザー2')).toBeInTheDocument()
  })

  // P0-R1-T5: 権限制御
  test('編集権限がない場合は編集ボタンが表示されない', () => {
    render(
      <CompanyCard 
        company={mockCompany}
        ceoName="田中太郎"
        members={mockMembers}
        currentUser={mockMembers[1]} // viewer権限
        editable={false}
      />
    )

    expect(screen.queryByTestId('company-edit-button')).not.toBeInTheDocument()
  })
})