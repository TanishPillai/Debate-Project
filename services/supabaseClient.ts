

import { createClient } from '@supabase/supabase-js';
import type { DebateFormat } from '../types';

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
      clubs: {
        Row: {
          id: string
          name: string
          description:string
          creator_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          creator_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          creator_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'clubs_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          club_id: string | null
        }
        Insert: {
          id: string
          name: string
          club_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          club_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_club_id_fkey'
            columns: ['club_id']
            isOneToOne: false
            referencedRelation: 'clubs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      debate_records: {
        Row: {
          id: string
          created_at: string
          topic: string
          format: DebateFormat
          speakers: Json
          transcript: Json
          feedback: Json
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          topic: string
          format: DebateFormat
          speakers: Json
          transcript: Json
          feedback: Json
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          topic?: string
          format?: DebateFormat
          speakers?: Json
          transcript?: Json
          feedback?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'debate_records_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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

// Hardcoding credentials to fix the application loading error.
// The previous approach using environment variables (`import.meta.env`) is incompatible 
// with this project's setup, as it does not use a build tool like Vite. 
// This change makes the app functional again.
const supabaseUrl = 'https://eprbjtfiecowflohpxmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwcmJqdGZpZWNvd2Zsb2hweG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTMxNDUsImV4cCI6MjA2ODk2OTE0NX0.RJojWS223cdFZVv26BRAMRUQTaSxPxU2ad_3V7oLsxI';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);