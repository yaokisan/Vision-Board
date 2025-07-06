/**
 * OrganizationDAO統合テスト
 * 実際のSupabaseデータベースとの連携をテスト
 */

import { OrganizationDAO } from '@/lib/member/OrganizationDAO'

describe('OrganizationDAO 統合テスト', () => {
  // テスト用のサンプルデータ（マイグレーションで作成されたデータを使用）
  const sampleCompanyId = '550e8400-e29b-41d4-a716-446655440000' // Empire Art
  const sampleBusinessId = '550e8400-e29b-41d4-a716-446655440010' // Webサービス事業
  const samplePositionId = '550e8400-e29b-41d4-a716-446655440030' // CEO
  const sampleMemberId = '550e8400-e29b-41d4-a716-446655440020' // 田中太郎

  describe('経営層（Position）の操作', () => {
    it('役職の現在の担当者を取得できる', async () => {
      const result = await OrganizationDAO.getCurrentPositionMember(samplePositionId)
      
      expect(result).toBeDefined()
      expect(result?.member_id).toBe(sampleMemberId) // 田中太郎がCEO
      expect(result?.person_name).toBe('田中太郎')
    })

    it('会社の全役職を取得できる', async () => {
      const positions = await OrganizationDAO.getPositionsByCompany(sampleCompanyId)
      
      expect(positions).toBeDefined()
      expect(Array.isArray(positions)).toBe(true)
      expect(positions.length).toBeGreaterThanOrEqual(3) // CEO, CTO, CFO
      
      // CEO役職の確認
      const ceoPosition = positions.find(p => p.name === 'CEO')
      expect(ceoPosition).toBeDefined()
      expect(ceoPosition?.member_id).toBe(sampleMemberId)
      expect(ceoPosition?.person_name).toBe('田中太郎')
    })

    it('役職の担当者を更新できる', async () => {
      // まず現在の担当者を保存
      const originalManager = await OrganizationDAO.getCurrentPositionMember(samplePositionId)
      
      // 別のメンバーに変更（佐藤花子のID）
      const newMemberId = '550e8400-e29b-41d4-a716-446655440021'
      const success = await OrganizationDAO.updatePositionMember(samplePositionId, newMemberId)
      expect(success).toBe(true)

      // 変更されたことを確認
      const updatedManager = await OrganizationDAO.getCurrentPositionMember(samplePositionId)
      expect(updatedManager?.member_id).toBe(newMemberId)
      expect(updatedManager?.person_name).toBe('佐藤花子')

      // 元に戻す
      if (originalManager?.member_id) {
        await OrganizationDAO.updatePositionMember(samplePositionId, originalManager.member_id)
      }
    })
  })

  describe('事業（Business）の操作', () => {
    it('事業の現在の責任者を取得できる', async () => {
      const result = await OrganizationDAO.getCurrentBusinessManager(sampleBusinessId)
      
      expect(result).toBeDefined()
      // サンプルデータでは文字列で設定されているため、member_idはnullの可能性
      expect(result?.person_name).toBe('田中太郎')
    })

    it('会社の全事業を取得できる', async () => {
      const businesses = await OrganizationDAO.getBusinessesByCompany(sampleCompanyId)
      
      expect(businesses).toBeDefined()
      expect(Array.isArray(businesses)).toBe(true)
      expect(businesses.length).toBeGreaterThanOrEqual(2) // Webサービス、コンサルティング
      
      // Webサービス事業の確認
      const webService = businesses.find(b => b.name === 'Webサービス事業')
      expect(webService).toBeDefined()
      expect(webService?.responsible_person).toBe('田中太郎')
      expect(webService?.goal).toBe('ユーザー数100万人達成')
    })

    it('事業名を取得できる', async () => {
      const name = await OrganizationDAO.getBusinessName(sampleBusinessId)
      expect(name).toBe('Webサービス事業')
    })

    it('事業の責任者を更新できる', async () => {
      // 新しい責任者に設定
      const newMemberId = '550e8400-e29b-41d4-a716-446655440021' // 佐藤花子
      const success = await OrganizationDAO.updateBusinessResponsiblePerson(sampleBusinessId, newMemberId)
      expect(success).toBe(true)

      // 変更されたことを確認
      const updatedManager = await OrganizationDAO.getCurrentBusinessManager(sampleBusinessId)
      expect(updatedManager?.member_id).toBe(newMemberId)
      expect(updatedManager?.person_name).toBe('佐藤花子')

      // 元に戻す（nullに設定）
      await OrganizationDAO.updateBusinessResponsiblePerson(sampleBusinessId, null)
    })
  })

  describe('業務（Task）の操作', () => {
    it('会社の全業務を取得できる', async () => {
      const tasks = await OrganizationDAO.getTasksByCompany(sampleCompanyId)
      
      expect(tasks).toBeDefined()
      expect(Array.isArray(tasks)).toBe(true)
      // サンプルデータにはtasksが含まれていない可能性があるため、配列であることのみ確認
    })

    it('業務名を取得できる（存在しない場合）', async () => {
      const fakTaskId = '00000000-0000-0000-0000-000000000000'
      const name = await OrganizationDAO.getTaskName(fakTaskId)
      expect(name).toBe(`業務-${fakTaskId}`) // フォールバック値
    })
  })

  describe('参照先名前の取得', () => {
    it('役職の参照先名前を取得できる', async () => {
      const name = await OrganizationDAO.getRoleReferenceName('position', samplePositionId)
      expect(name).toBe('CEO') // positions.nameから取得
    })

    it('事業責任者の参照先名前を取得できる', async () => {
      const name = await OrganizationDAO.getRoleReferenceName('business_manager', sampleBusinessId)
      expect(name).toBe('Webサービス事業') // businesses.nameから取得
    })

    it('不明な役割タイプの場合のフォールバック', async () => {
      const name = await OrganizationDAO.getRoleReferenceName('unknown_role' as any, 'test-id')
      expect(name).toBe('不明-test-id')
    })
  })

  describe('エラーハンドリング', () => {
    it('存在しない役職IDの場合', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const result = await OrganizationDAO.getCurrentPositionMember(fakeId)
      expect(result).toBeNull()
    })

    it('存在しない事業IDの場合', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const result = await OrganizationDAO.getCurrentBusinessManager(fakeId)
      expect(result).toBeNull()
    })

    it('存在しない会社IDの場合', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const positions = await OrganizationDAO.getPositionsByCompany(fakeId)
      expect(positions).toEqual([])

      const businesses = await OrganizationDAO.getBusinessesByCompany(fakeId)
      expect(businesses).toEqual([])

      const tasks = await OrganizationDAO.getTasksByCompany(fakeId)
      expect(tasks).toEqual([])
    })

    it('不正なIDでの更新操作', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const positionResult = await OrganizationDAO.updatePositionMember(fakeId, sampleMemberId)
      expect(positionResult).toBe(false)

      const businessResult = await OrganizationDAO.updateBusinessResponsiblePerson(fakeId, sampleMemberId)
      expect(businessResult).toBe(false)

      const taskResult = await OrganizationDAO.updateTaskResponsiblePerson(fakeId, sampleMemberId)
      expect(taskResult).toBe(false)
    })
  })
})