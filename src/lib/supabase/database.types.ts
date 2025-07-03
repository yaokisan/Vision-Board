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
          name: string
          person_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          person_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          person_name?: string
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
          }
        ]
      }
      layers: {
        Row: {
          id: string
          company_id: string
          name: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          type: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          type?: string
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
          goal: string
          responsible_person: string
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
          goal: string
          responsible_person: string
          category?: string | null
          position_x: number
          position_y: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          layer_id?: string
          name?: string
          goal?: string
          responsible_person?: string
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
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          business_id: string | null
          layer_id: string
          name: string
          goal: string
          responsible_person: string
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
          goal: string
          responsible_person: string
          group_name?: string | null
          position_x: number
          position_y: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          layer_id?: string
          name?: string
          goal?: string
          responsible_person?: string
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