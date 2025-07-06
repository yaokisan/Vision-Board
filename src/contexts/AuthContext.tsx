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
        
        // TODO: メンバーデータ読み込みは後で実装
        // if (session?.user) {
        //   await loadMemberData(session.user.id)
        // }
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
        
        // TODO: メンバーデータ読み込みは後で実装
        // if (session?.user) {
        //   await loadMemberData(session.user.id)
        // } else {
        //   setMember(null)
        // }
        setMember(null) // 一時的にnullに設定
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // メンバーデータを読み込み
  const loadMemberData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // レコードが見つからない場合以外のエラー
        console.error('メンバーデータ取得エラー:', error)
        return
      }

      if (data) {
        setMember({
          id: data.id,
          company_id: data.company_id,
          name: data.name,
          email: data.email,
          permission: data.permission,
          member_type: data.member_type,
          created_at: data.created_at,
          updated_at: data.updated_at
        })
      } else {
        // メンバーデータが見つからない場合（新規ユーザー）
        console.log('メンバーデータが見つかりません。新規ユーザーの可能性があります。')
        setMember(null)
      }
    } catch (error) {
      console.error('メンバーデータ読み込みエラー:', error)
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        return { error }
      }

      // メンバーレコードを作成（サインアップが成功した場合）
      if (data.user && !error) {
        const { error: memberError } = await supabase
          .from('members')
          .insert({
            auth_user_id: data.user.id,
            name: userData.name,
            email: email,
            permission: userData.permission || 'viewer',
            member_type: 'core',
            company_id: '550e8400-e29b-41d4-a716-446655440000' // 暫定的な会社ID
          })

        if (memberError) {
          console.error('メンバー作成エラー:', memberError)
        }
      }

      return { error: null }
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