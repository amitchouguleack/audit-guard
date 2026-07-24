'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Redirecting to dashboard...</div>
    </div>
  )
}
