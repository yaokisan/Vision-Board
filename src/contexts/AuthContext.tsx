'use client'

/**
 * 認証コンテキスト
 * Supabase Authを使用したユーザー認証管理
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Member } from '@/types'
import { AuthContextType, SignUpData } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadMemberData(session.user.id, session.user)
        }
      } catch (error) {
        console.error('セッション取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadMemberData(session.user.id, session.user)
        } else {
          setMember(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // メンバーデータを読み込み
  const loadMemberData = async (userId: string, userObj?: any) => {
    console.log('メンバーデータ読み込み開始:', userId)
    
    if (!userId) {
      console.error('User ID is null or undefined')
      setMember(null)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      console.log('Supabaseレスポンス:', { data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('メンバーレコードが見つかりません（新規ユーザーまたはトリガー未実行）')
          // 新規ユーザーの場合は会社・メンバーレコードを作成
          if (userObj && userObj.id) {
            await createNewUserCompanyAndMember(userObj.id, userObj.email || '')
          } else {
            console.error('User情報が不正です:', userObj || user)
          }
          return
        } else if (error.code === '42501') {
          console.log('メンバーデータアクセス権限がありません（RLSポリシー）')
        } else {
          console.error('メンバーデータ取得エラー:', error)
        }
        setMember(null)
        return
      }

      if (data) {
        console.log('メンバーデータ設定:', data)
        setMember({
          id: data.id,
          company_id: data.company_id,
          auth_user_id: data.auth_user_id,
          name: data.name,
          email: data.email,
          permission: data.permission,
          member_type: data.member_type,
          created_at: data.created_at,
          updated_at: data.updated_at
        })
      } else {
        console.log('メンバーデータがnull - 新規ユーザーのため会社とメンバーレコードを作成')
        await createNewUserCompanyAndMember(user.id, user.email || '')
      }
    } catch (error) {
      console.error('メンバーデータ読み込み例外エラー:', error)
      setMember(null)
    }
  }

  // サインイン
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // サインアップ
  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // パスワードリセット
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // 新規ユーザーの会社・メンバーレコード作成
  const createNewUserCompanyAndMember = async (authUserId: string, email: string) => {
    try {
      console.log('🏗️ Creating new company and member for user:', authUserId, email)
      
      // 0. 既存メンバーレコードの重複チェック
      const { data: existingMember, error: checkError } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single()

      if (!checkError && existingMember) {
        console.log('✅ Existing member found, skipping creation:', existingMember)
        setMember({
          id: existingMember.id,
          company_id: existingMember.company_id,
          auth_user_id: existingMember.auth_user_id,
          name: existingMember.name,
          email: existingMember.email,
          permission: existingMember.permission,
          member_type: existingMember.member_type,
          created_at: existingMember.created_at,
          updated_at: existingMember.updated_at
        })
        return
      }
      
      console.log('📝 No existing member found, creating new company and member')
      
      // 1. 新しい会社を作成
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: `${email.split('@')[0]}の会社`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (companyError) {
        console.error('Company creation error:', companyError)
        return
      }

      // 2. メンバーレコードを作成
      const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
          company_id: company.id,
          auth_user_id: authUserId,
          name: email.split('@')[0],
          email: email,
          permission: 'admin',
          member_type: 'core',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (memberError) {
        console.error('Member creation error:', memberError)
        return
      }

      console.log('✅ Successfully created company and member:', { company, member })
      
      // 3. メンバー情報を設定
      setMember({
        id: member.id,
        company_id: member.company_id,
        auth_user_id: member.auth_user_id,
        name: member.name,
        email: member.email,
        permission: member.permission,
        member_type: member.member_type,
        created_at: member.created_at,
        updated_at: member.updated_at
      })

    } catch (error) {
      console.error('新規ユーザー作成エラー:', error)
    }
  }

  const value = {
    user,
    member,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}