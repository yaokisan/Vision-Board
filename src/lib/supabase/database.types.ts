export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          id: string
          company_id: string
          name: 'CEO' | 'CTO' | 'CFO' | 'COO'
          member_id: string | null
          person_name: string | null
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: 'CEO' | 'CTO' | 'CFO' | 'COO'
          member_id?: string | null
          person_name?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: 'CEO' | 'CTO' | 'CFO' | 'COO'
          member_id?: string | null
          person_name?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          }
        ]
      }
      layers: {
        Row: {
          id: string
          company_id: string
          name: string
          type: 'business' | 'management'
          display_tab: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          type: 'business' | 'management'
          display_tab?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          type?: 'business' | 'management'
          display_tab?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      businesses: {
        Row: {
          id: string
          layer_id: string
          name: string
          goal: string | null
          responsible_person_id: string | null
          responsible_person: string | null
          category: string | null
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          layer_id: string
          name: string
          goal?: string | null
          responsible_person_id?: string | null
          responsible_person?: string | null
          category?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          layer_id?: string
          name?: string
          goal?: string | null
          responsible_person_id?: string | null
          responsible_person?: string | null
          category?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          business_id: string | null
          layer_id: string
          name: string
          goal: string | null
          responsible_person_id: string | null
          responsible_person: string | null
          group_name: string | null
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          layer_id: string
          name: string
          goal?: string | null
          responsible_person_id?: string | null
          responsible_person?: string | null
          group_name?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          layer_id?: string
          name?: string
          goal?: string | null
          responsible_person_id?: string | null
          responsible_person?: string | null
          group_name?: string | null
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_responsible_person_id_fkey"
            columns: ["responsible_person_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          }
        ]
      }
      executors: {
        Row: {
          id: string
          task_id: string
          name: string
          role: string
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          name: string
          role: string
          position_x: number
          position_y: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          name?: string
          role?: string
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "executors_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      members: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string
          permission: 'admin' | 'viewer' | 'restricted'
          member_type: 'core' | 'business'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email: string
          permission: 'admin' | 'viewer' | 'restricted'
          member_type: 'core' | 'business'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string
          permission?: 'admin' | 'viewer' | 'restricted'
          member_type?: 'core' | 'business'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      member_businesses: {
        Row: {
          id: string
          member_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          business_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_businesses_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      member_roles: {
        Row: {
          id: string
          member_id: string
          role_type: 'position' | 'business_manager' | 'task_manager'
          reference_id: string
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          role_type: 'position' | 'business_manager' | 'task_manager'
          reference_id: string
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          role_type?: 'position' | 'business_manager' | 'task_manager'
          reference_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}