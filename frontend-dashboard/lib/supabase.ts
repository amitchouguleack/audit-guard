import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return null

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

export function getSupabase(): SupabaseClient {
  const client = getClient()
  if (!client) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
  }
  return client
}

export function getSupabaseClient(): SupabaseClient | null {
  return getClient()
}

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          org_id: string
          source_identifier: string
          raw_content: string
          content_hash: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          risk_score: number | null
          created_at: string
          processed_at: string | null
        }
      }
      violations: {
        Row: {
          id: string
          log_id: string
          org_id: string
          violation_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          matched_content: string
          match_offset: number
          match_length: number
          created_at: string
        }
      }
    }
    Functions: {
      get_compliance_summary: {
        Args: { p_org_id: string }
        Returns: {
          total_logs: number
          pending_logs: number
          completed_logs: number
          failed_logs: number
          total_violations: number
          critical_violations: number
          avg_risk_score: number
          recent_violations: any[]
        }
      }
    }
  }
}
