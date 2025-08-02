import { createClient } from '@supabase/supabase-js';

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
        Relationships: []
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
        Relationships: []
      }
      debate_records: {
        Row: {
          id: string
          created_at: string
          topic: string
          format: string
          speakers: Json
          transcript: Json
          feedback: Json
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          topic: string
          format: string
          speakers: Json
          transcript: Json
          feedback: Json
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          topic?: string
          format?: string
          speakers?: Json
          transcript?: Json
          feedback?: Json
          user_id?: string
        }
        Relationships: []
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

// Access environment variables using Vite's `import.meta.env`
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPA_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create a real client if configured, otherwise create a mock client to prevent crashes.
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : createClient<Database>('http://localhost:54321', 'any-key-will-do-for-mock-client');