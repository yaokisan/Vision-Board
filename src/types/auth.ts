/**
 * 認証関連の型定義
 */

import { User } from '@supabase/supabase-js'
import { Member } from './index'

export interface AuthUser extends User {
  // Supabaseユーザーを拡張
}

export interface AuthContextType {
  user: AuthUser | null
  member: Member | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

export interface SignUpData {
  name: string
  company_name?: string
  permission?: 'admin' | 'viewer' | 'restricted'
}

export interface AuthError {
  message: string
  status?: number
}