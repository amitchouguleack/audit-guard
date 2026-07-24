'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { ScanForm } from '@/components/ScanForm'
import { Results } from '@/components/Results'

export default function DashboardPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Compliance Scanner</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze content for PII, credentials, and compliance violations
          </p>
        </div>

        <ScanForm
          onResults={setResults}
          loading={loading}
          setLoading={setLoading}
        />

        {results && <Results data={results} />}
      </main>
    </div>
  )
}
