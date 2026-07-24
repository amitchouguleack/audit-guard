import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
