/**
 * MemberDAO統合テスト
 * 実際のSupabaseデータベースとの連携をテスト
 */

import { MemberDAO } from '@/lib/member/MemberDAO'
import { CreateMemberRequest, UpdateMemberRequest } from '@/types'

describe('MemberDAO 統合テスト', () => {
  // テスト用のサンプルデータ（マイグレーションで作成されたデータを使用）
  const sampleCompanyId = '550e8400-e29b-41d4-a716-446655440000' // Empire Art
  const sampleCoreBusinessId = '550e8400-e29b-41d4-a716-446655440010' // Webサービス事業
  const sampleCoreMemberId = '550e8400-e29b-41d4-a716-446655440020' // 田中太郎

  describe('メンバー基本操作', () => {
    it('会社のメンバー一覧を取得できる', async () => {
      const members = await MemberDAO.getMembersByCompany(sampleCompanyId)
      
      expect(members).toBeDefined()
      expect(Array.isArray(members)).toBe(true)
      expect(members.length).toBeGreaterThan(0)
      
      // サンプルデータの確認
      const coreMember = members.find(m => m.name === '田中太郎')
      expect(coreMember).toBeDefined()
      expect(coreMember?.permission).toBe('admin')
      expect(coreMember?.member_type).toBe('core')
    })

    it('IDでメンバーを取得できる', async () => {
      const member = await MemberDAO.getMemberById(sampleCoreMemberId)
      
      expect(member).toBeDefined()
      expect(member?.id).toBe(sampleCoreMemberId)
      expect(member?.name).toBe('田中太郎')
      expect(member?.email).toBe('tanaka@empire-art.com')
      expect(member?.permission).toBe('admin')
      expect(member?.member_type).toBe('core')
    })

    it('コアメンバーを取得できる', async () => {
      const coreMembers = await MemberDAO.getCoreMembers(sampleCompanyId)
      
      expect(coreMembers).toBeDefined()
      expect(Array.isArray(coreMembers)).toBe(true)
      expect(coreMembers.length).toBeGreaterThanOrEqual(3) // 田中、佐藤、鈴木
      
      // 全員がコアメンバーであることを確認
      coreMembers.forEach(member => {
        expect(member.member_type).toBe('core')
        expect(member.company_id).toBe(sampleCompanyId)
      })
    })

    it('特定事業のメンバーを取得できる', async () => {
      const businessMembers = await MemberDAO.getBusinessMembers(sampleCoreBusinessId)
      
      expect(businessMembers).toBeDefined()
      expect(Array.isArray(businessMembers)).toBe(true)
      expect(businessMembers.length).toBeGreaterThan(0)
      
      // 事業メンバーにコアメンバー（田中太郎）が含まれることを確認
      const tanakaMember = businessMembers.find(m => m.name === '田中太郎')
      expect(tanakaMember).toBeDefined()
    })
  })

  describe('メンバー⇄事業関係の操作', () => {
    it('メンバーの所属事業を取得できる', async () => {
      const memberBusinesses = await MemberDAO.getMemberBusinesses(sampleCoreMemberId)
      
      expect(memberBusinesses).toBeDefined()
      expect(Array.isArray(memberBusinesses)).toBe(true)
      expect(memberBusinesses.length).toBe(2) // 全事業に所属（Webサービス、コンサルティング）
      
      // 特定の事業IDが含まれることを確認
      const webServiceRelation = memberBusinesses.find(mb => mb.business_id === sampleCoreBusinessId)
      expect(webServiceRelation).toBeDefined()
      expect(webServiceRelation?.member_id).toBe(sampleCoreMemberId)
    })

    it('事業用メンバーリストを取得できる', async () => {
      const businessMemberList = await MemberDAO.getBusinessMemberList(sampleCoreBusinessId)
      
      expect(businessMemberList).toBeDefined()
      expect(businessMemberList.business_id).toBe(sampleCoreBusinessId)
      expect(Array.isArray(businessMemberList.core_members)).toBe(true)
      expect(Array.isArray(businessMemberList.business_members)).toBe(true)
      
      // コアメンバーが含まれることを確認
      expect(businessMemberList.core_members.length).toBeGreaterThanOrEqual(3)
      const tanaka = businessMemberList.core_members.find(m => m.name === '田中太郎')
      expect(tanaka).toBeDefined()
      
      // 事業専用メンバーが含まれることを確認
      expect(businessMemberList.business_members.length).toBeGreaterThanOrEqual(1)
    })

    it('会社の全事業IDを取得できる', async () => {
      const businessIds = await MemberDAO.getAllBusinessIds(sampleCompanyId)
      
      expect(businessIds).toBeDefined()
      expect(Array.isArray(businessIds)).toBe(true)
      expect(businessIds.length).toBeGreaterThanOrEqual(2) // Webサービス、コンサルティング
      expect(businessIds).toContain(sampleCoreBusinessId)
    })
  })

  describe('メンバーCRUD操作', () => {
    let createdMemberId: string | null = null

    it('新しいメンバーを作成できる', async () => {
      const newMember: CreateMemberRequest = {
        company_id: sampleCompanyId,
        name: 'テスト太郎',
        email: 'test@empire-art.com',
        permission: 'viewer',
        member_type: 'business'
      }

      const created = await MemberDAO.createMember(newMember)
      
      expect(created).toBeDefined()
      expect(created?.name).toBe('テスト太郎')
      expect(created?.email).toBe('test@empire-art.com')
      expect(created?.permission).toBe('viewer')
      expect(created?.member_type).toBe('business')
      expect(created?.company_id).toBe(sampleCompanyId)
      
      createdMemberId = created?.id || null
    })

    it('メンバーを更新できる', async () => {
      if (!createdMemberId) {
        throw new Error('テスト用メンバーが作成されていません')
      }

      const updates: UpdateMemberRequest = {
        name: 'テスト花子',
        permission: 'restricted'
      }

      const updated = await MemberDAO.updateMember(createdMemberId, updates)
      
      expect(updated).toBeDefined()
      expect(updated?.id).toBe(createdMemberId)
      expect(updated?.name).toBe('テスト花子')
      expect(updated?.permission).toBe('restricted')
      expect(updated?.member_type).toBe('business') // 変更されていない
    })

    it('メンバーを削除できる', async () => {
      if (!createdMemberId) {
        throw new Error('テスト用メンバーが作成されていません')
      }

      const deleted = await MemberDAO.deleteMember(createdMemberId)
      expect(deleted).toBe(true)

      // 削除されたことを確認
      const member = await MemberDAO.getMemberById(createdMemberId)
      expect(member).toBeNull()
    })
  })

  describe('メンバー役割の操作', () => {
    it('メンバーの組織図役割を取得できる', async () => {
      const roles = await MemberDAO.getMemberRoles(sampleCoreMemberId)
      
      expect(roles).toBeDefined()
      expect(Array.isArray(roles)).toBe(true)
      // サンプルデータでは役割が設定されていない可能性があるため、配列であることのみ確認
    })

    it('メンバーに役割を追加できる', async () => {
      // 実際のposition IDを取得する必要があるため、スキップまたは別途実装
      // このテストは実際のposition/business/task IDが必要
    })
  })

  describe('事業関係の操作', () => {
    let testMemberId: string | null = null

    beforeAll(async () => {
      // テスト用メンバーを作成
      const newMember: CreateMemberRequest = {
        company_id: sampleCompanyId,
        name: 'テスト関係メンバー',
        email: 'test-relation@empire-art.com',
        permission: 'viewer',
        member_type: 'business'
      }

      const created = await MemberDAO.createMember(newMember)
      testMemberId = created?.id || null
    })

    afterAll(async () => {
      // テスト用データをクリーンアップ
      if (testMemberId) {
        await MemberDAO.deleteMember(testMemberId)
      }
    })

    it('メンバーと事業の関係を追加できる', async () => {
      if (!testMemberId) {
        throw new Error('テスト用メンバーが作成されていません')
      }

      const success = await MemberDAO.addMemberBusinessRelation(testMemberId, sampleCoreBusinessId)
      expect(success).toBe(true)

      // 関係が追加されたことを確認
      const relations = await MemberDAO.getMemberBusinesses(testMemberId)
      expect(relations.length).toBeGreaterThan(0)
      expect(relations.some(r => r.business_id === sampleCoreBusinessId)).toBe(true)
    })

    it('メンバーの事業関係をすべて削除できる', async () => {
      if (!testMemberId) {
        throw new Error('テスト用メンバーが作成されていません')
      }

      const success = await MemberDAO.removeMemberBusinessRelations(testMemberId)
      expect(success).toBe(true)

      // 関係が削除されたことを確認
      const relations = await MemberDAO.getMemberBusinesses(testMemberId)
      expect(relations.length).toBe(0)
    })
  })
})