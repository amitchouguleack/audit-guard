'use client'

import { useState } from 'react'

interface ScanFormProps {
  onResults: (data: any) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export function ScanForm({ onResults, loading, setLoading }: ScanFormProps) {
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [endpoint, setEndpoint] = useState('/api/ingest')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          source: source || 'dashboard'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed')
      }

      onResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Endpoint
          </label>
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="/api/ingest">Single Log Analysis (with risk scoring)</option>
            <option value="/api/scan">Bulk Scan (regex only, faster)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Identifier (optional)
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., form-submission, log-file, api-request"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content to Analyze
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder={`Paste content here...\n\nExamples of what will be detected:\n- SSN: 123-45-6789\n- Email: user@example.com\n- Password: password=secret123\n- Bearer token: Bearer eyJhbGc...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            required
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Scan Content'}
        </button>
      </form>
    </div>
  )
}
