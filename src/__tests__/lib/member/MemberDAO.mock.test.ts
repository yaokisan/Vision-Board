/**
 * MemberDAO モックテスト
 * Supabaseクライアントをモックして、ビジネスロジックのテストを実行
 */

// Supabaseをモック
jest.mock('@supabase/supabase-js')

import { MemberDAO } from '@/lib/member/MemberDAO'
import { CreateMemberRequest, UpdateMemberRequest } from '@/types'

describe('MemberDAO モックテスト', () => {

  describe('メンバー基本操作', () => {
    it('会社のメンバー一覧を取得できる', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440000'
      const members = await MemberDAO.getMembersByCompany(companyId)
      
      expect(members).toBeDefined()
      expect(Array.isArray(members)).toBe(true)
      expect(members.length).toBe(2) // 田中太郎、佐藤花子
      
      const tanaka = members.find(m => m.name === '田中太郎')
      expect(tanaka).toBeDefined()
      expect(tanaka?.permission).toBe('admin')
      expect(tanaka?.member_type).toBe('core')
    })

    it('IDでメンバーを取得できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020'
      const member = await MemberDAO.getMemberById(memberId)
      
      expect(member).toBeDefined()
      expect(member?.id).toBe(memberId)
      expect(member?.name).toBe('田中太郎')
      expect(member?.email).toBe('tanaka@empire-art.com')
    })

    it('存在しないIDの場合nullを返す', async () => {
      const fakeMemberId = '00000000-0000-0000-0000-000000000000'
      const member = await MemberDAO.getMemberById(fakeMemberId)
      
      expect(member).toBeNull()
    })

    it('コアメンバーを取得できる', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440000'
      const coreMembers = await MemberDAO.getCoreMembers(companyId)
      
      expect(coreMembers).toBeDefined()
      expect(Array.isArray(coreMembers)).toBe(true)
      expect(coreMembers.length).toBe(2) // 田中太郎、佐藤花子（両方core）
      
      coreMembers.forEach(member => {
        expect(member.member_type).toBe('core')
        expect(member.company_id).toBe(companyId)
      })
    })
  })

  describe('メンバーCRUD操作', () => {
    it('新しいメンバーを作成できる', async () => {
      const newMember: CreateMemberRequest = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
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
      expect(created?.id).toBeDefined()
    })

    it('メンバーを更新できる', async () => {
      // まずメンバーを作成
      const newMember: CreateMemberRequest = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト太郎',
        email: 'test@empire-art.com',
        permission: 'viewer',
        member_type: 'business'
      }

      const created = await MemberDAO.createMember(newMember)
      expect(created?.id).toBeDefined()

      // 更新
      const updates: UpdateMemberRequest = {
        name: 'テスト花子',
        permission: 'restricted'
      }

      const updated = await MemberDAO.updateMember(created!.id, updates)
      
      expect(updated).toBeDefined()
      expect(updated?.id).toBe(created?.id)
      expect(updated?.name).toBe('テスト花子')
      expect(updated?.permission).toBe('restricted')
      expect(updated?.member_type).toBe('business') // 変更されていない
    })

    it('メンバーを削除できる', async () => {
      // まずメンバーを作成
      const newMember: CreateMemberRequest = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト太郎',
        email: 'test@empire-art.com',
        permission: 'viewer',
        member_type: 'business'
      }

      const created = await MemberDAO.createMember(newMember)
      expect(created?.id).toBeDefined()

      // 削除
      const deleted = await MemberDAO.deleteMember(created!.id)
      expect(deleted).toBe(true)

      // 削除されたことを確認
      const member = await MemberDAO.getMemberById(created!.id)
      expect(member).toBeNull()
    })
  })

  describe('メンバー⇄事業関係の操作', () => {
    it('メンバーの所属事業を取得できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020' // 田中太郎
      const memberBusinesses = await MemberDAO.getMemberBusinesses(memberId)
      
      expect(memberBusinesses).toBeDefined()
      expect(Array.isArray(memberBusinesses)).toBe(true)
      expect(memberBusinesses.length).toBe(1) // Webサービス事業に所属

      const relation = memberBusinesses[0]
      expect(relation.member_id).toBe(memberId)
      expect(relation.business_id).toBe('550e8400-e29b-41d4-a716-446655440010')
    })

    it('メンバーと事業の関係を追加できる', async () => {
      // まずメンバーを作成
      const newMember: CreateMemberRequest = {
        company_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト関係メンバー',
        email: 'test-relation@empire-art.com',
        permission: 'viewer',
        member_type: 'business'
      }

      const created = await MemberDAO.createMember(newMember)
      expect(created?.id).toBeDefined()

      // 事業関係を追加
      const businessId = '550e8400-e29b-41d4-a716-446655440010'
      const success = await MemberDAO.addMemberBusinessRelation(created!.id, businessId)
      expect(success).toBe(true)

      // 関係が追加されたことを確認
      const relations = await MemberDAO.getMemberBusinesses(created!.id)
      expect(relations.length).toBe(1)
      expect(relations[0].business_id).toBe(businessId)
    })

    it('メンバーの事業関係をすべて削除できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020' // 田中太郎

      // 削除前の確認
      const beforeRelations = await MemberDAO.getMemberBusinesses(memberId)
      expect(beforeRelations.length).toBeGreaterThan(0)

      // 削除
      const success = await MemberDAO.removeMemberBusinessRelations(memberId)
      expect(success).toBe(true)

      // 削除されたことを確認
      const afterRelations = await MemberDAO.getMemberBusinesses(memberId)
      expect(afterRelations.length).toBe(0)
    })
  })

  describe('メンバー役割の操作', () => {
    it('メンバーの組織図役割を取得できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020'
      const roles = await MemberDAO.getMemberRoles(memberId)
      
      expect(roles).toBeDefined()
      expect(Array.isArray(roles)).toBe(true)
      // 初期状態では役割が設定されていないため、空配列
      expect(roles.length).toBe(0)
    })

    it('メンバーに役割を追加できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020'
      const role = {
        member_id: memberId,
        role_type: 'position' as const,
        reference_id: '550e8400-e29b-41d4-a716-446655440030' // CEO
      }

      const success = await MemberDAO.addMemberRole(role)
      expect(success).toBe(true)

      // 役割が追加されたことを確認
      const roles = await MemberDAO.getMemberRoles(memberId)
      expect(roles.length).toBe(1)
      expect(roles[0].role_type).toBe('position')
      expect(roles[0].reference_id).toBe('550e8400-e29b-41d4-a716-446655440030')
    })

    it('メンバーの特定役割を削除できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020'
      
      // まず役割を追加
      await MemberDAO.addMemberRole({
        member_id: memberId,
        role_type: 'position',
        reference_id: '550e8400-e29b-41d4-a716-446655440030'
      })

      // 削除
      const success = await MemberDAO.removeMemberRole(
        memberId, 
        'position', 
        '550e8400-e29b-41d4-a716-446655440030'
      )
      expect(success).toBe(true)

      // 削除されたことを確認
      const roles = await MemberDAO.getMemberRoles(memberId)
      expect(roles.length).toBe(0)
    })

    it('メンバーのすべての役割を削除できる', async () => {
      const memberId = '550e8400-e29b-41d4-a716-446655440020'
      
      // 複数の役割を追加
      await MemberDAO.addMemberRole({
        member_id: memberId,
        role_type: 'position',
        reference_id: '550e8400-e29b-41d4-a716-446655440030'
      })
      await MemberDAO.addMemberRole({
        member_id: memberId,
        role_type: 'business_manager',
        reference_id: '550e8400-e29b-41d4-a716-446655440010'
      })

      // すべて削除
      const success = await MemberDAO.removeAllMemberRoles(memberId)
      expect(success).toBe(true)

      // すべて削除されたことを確認
      const roles = await MemberDAO.getMemberRoles(memberId)
      expect(roles.length).toBe(0)
    })
  })

  describe('ユーティリティ関数', () => {
    it('会社の全事業IDを取得できる', async () => {
      const companyId = '550e8400-e29b-41d4-a716-446655440000'
      const businessIds = await MemberDAO.getAllBusinessIds(companyId)
      
      expect(businessIds).toBeDefined()
      expect(Array.isArray(businessIds)).toBe(true)
      expect(businessIds.length).toBe(1) // Webサービス事業
      expect(businessIds[0]).toBe('550e8400-e29b-41d4-a716-446655440010')
    })
  })
})