'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface RiskChartProps {
  orgId: string
}

interface ChartData {
  date: string
  risk_score: number
}

export function RiskChart({ orgId }: RiskChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChartData() {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('created_at, risk_score')
        .eq('org_id', orgId)
        .not('risk_score', 'is', null)
        .order('created_at', { ascending: true })
        .limit(30)

      if (logs && !error) {
        const chartData = logs.map(log => ({
          date: new Date(log.created_at).toLocaleDateString(),
          risk_score: log.risk_score
        }))
        setData(chartData)
      }

      setLoading(false)
    }

    loadChartData()
  }, [orgId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading chart data...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No risk data available yet
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value: number) => [value, 'Risk Score']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="risk_score"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ fill: '#0ea5e9', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
