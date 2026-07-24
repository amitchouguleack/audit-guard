interface Violation {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface ViolationsListProps {
  violations: Violation[]
}

export function ViolationsList({ violations }: ViolationsListProps) {
  if (violations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No violations detected
      </div>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return styles[severity] || styles.low
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {violations.map((violation) => (
        <div
          key={violation.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityBadge(violation.severity)}`}>
              {violation.severity}
            </span>
            <span className="text-sm text-gray-900">{violation.type}</span>
          </div>
          <time className="text-xs text-gray-500">
            {new Date(violation.created_at).toLocaleDateString()}
          </time>
        </div>
      ))}
    </div>
  )
}
