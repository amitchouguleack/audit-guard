'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { ComplianceSummary } from '@/components/ComplianceSummary'
import { ViolationsList } from '@/components/ViolationsList'
import { RiskChart } from '@/components/RiskChart'
import { Header } from '@/components/Header'

interface DashboardData {
  totalLogs: number
  pendingLogs: number
  completedLogs: number
  failedLogs: number
  totalViolations: number
  criticalViolations: number
  avgRiskScore: number
  recentViolations: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadDashboard() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setOrgId(profile.id)
        await loadComplianceData(profile.id)
      }

      setLoading(false)
    }

    loadDashboard()
  }, [router])

  async function loadComplianceData(orgId: string) {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('get_compliance_summary', {
      p_org_id: orgId
    })

    if (data && !error) {
      setData({
        totalLogs: data.total_logs || 0,
        pendingLogs: data.pending_logs || 0,
        completedLogs: data.completed_logs || 0,
        failedLogs: data.failed_logs || 0,
        totalViolations: data.total_violations || 0,
        criticalViolations: data.critical_violations || 0,
        avgRiskScore: data.avg_risk_score || 0,
        recentViolations: data.recent_violations || []
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time monitoring of your organization&apos;s compliance status
          </p>
        </div>

        {data && (
          <>
            <ComplianceSummary data={data} />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Risk Score Trend
                </h2>
                <RiskChart orgId={orgId!} />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Violations
                </h2>
                <ViolationsList violations={data.recentViolations} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
