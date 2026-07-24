interface ComplianceSummaryProps {
  data: {
    totalLogs: number
    pendingLogs: number
    completedLogs: number
    failedLogs: number
    totalViolations: number
    criticalViolations: number
    avgRiskScore: number
  }
}

export function ComplianceSummary({ data }: ComplianceSummaryProps) {
  const stats = [
    {
      name: 'Total Logs',
      value: data.totalLogs,
      color: 'text-gray-900',
      bgColor: 'bg-gray-50'
    },
    {
      name: 'Completed',
      value: data.completedLogs,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Pending',
      value: data.pendingLogs,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      name: 'Failed',
      value: data.failedLogs,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      name: 'Total Violations',
      value: data.totalViolations,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      name: 'Critical',
      value: data.criticalViolations,
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    }
  ]

  const getRiskLevel = (score: number) => {
    if (score < 25) return { label: 'Low', color: 'text-green-600' }
    if (score < 50) return { label: 'Medium', color: 'text-yellow-600' }
    if (score < 75) return { label: 'High', color: 'text-orange-600' }
    return { label: 'Critical', color: 'text-red-600' }
  }

  const riskLevel = getRiskLevel(data.avgRiskScore)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}
        >
          <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
          <dd className={`mt-1 text-2xl font-semibold ${stat.color}`}>
            {stat.value}
          </dd>
        </div>
      ))}

      <div className="bg-white rounded-lg p-4 border border-gray-200 col-span-2 md:col-span-3 lg:col-span-6">
        <div className="flex items-center justify-between">
          <div>
            <dt className="text-sm font-medium text-gray-500">Average Risk Score</dt>
            <dd className="mt-1 text-3xl font-bold text-gray-900">
              {data.avgRiskScore.toFixed(1)}
            </dd>
          </div>
          <div className="text-right">
            <span className={`text-lg font-semibold ${riskLevel.color}`}>
              {riskLevel.label}
            </span>
            <p className="text-sm text-gray-500">Risk Level</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              data.avgRiskScore < 25 ? 'bg-green-500' :
              data.avgRiskScore < 50 ? 'bg-yellow-500' :
              data.avgRiskScore < 75 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(data.avgRiskScore, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
