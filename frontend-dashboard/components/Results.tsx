'use client'

interface ResultsProps {
  data: any
}

export function Results({ data }: ResultsProps) {
  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return colors[level] || colors.low
  }

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    }
    return colors[severity] || colors.low
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Results</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{data.risk_score}</div>
          <div className="text-sm text-gray-500">Risk Score</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${getRiskColor(data.risk_level).split(' ')[1]}`}>
            {data.risk_level?.toUpperCase()}
          </div>
          <div className="text-sm text-gray-500">Risk Level</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{data.violations_found}</div>
          <div className="text-sm text-gray-500">Violations</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{data.entries_scanned || 1}</div>
          <div className="text-sm text-gray-500">Entries Scanned</div>
        </div>
      </div>

      {data.findings && data.findings.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Violations Found</h3>
          <div className="space-y-2">
            {data.findings.map((finding: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${getSeverityColor(finding.severity)}`}>
                    [{finding.severity?.toUpperCase()}]
                  </span>
                  <span className="text-sm text-gray-900">{finding.type}</span>
                </div>
                <code className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {finding.matched}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.results && data.results.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Per-Entry Results</h3>
          <div className="space-y-2">
            {data.results.map((result: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-600">Entry {index + 1}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {result.violations} violations
                  </span>
                  <span className={`text-sm font-medium ${getRiskColor(
                    result.risk_score < 15 ? 'low' :
                    result.risk_score < 40 ? 'medium' :
                    result.risk_score < 70 ? 'high' : 'critical'
                  ).split(' ')[1]}`}>
                    Score: {result.risk_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.content_stats && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Content: {data.content_stats.characters} characters, {data.content_stats.words} words
          </div>
        </div>
      )}
    </div>
  )
}
