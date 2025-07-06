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
          await loadMemberData(session.user.id)
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
          await loadMemberData(session.user.id)
        } else {
          setMember(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // メンバーデータを読み込み
  const loadMemberData = async (userId: string) => {
    console.log('メンバーデータ読み込み開始:', userId)
    
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
        console.log('メンバーデータがnull')
        setMember(null)
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