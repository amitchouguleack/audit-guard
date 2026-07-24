'use client'

import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export function Header() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">Audit Guard</h1>
            <span className="ml-2 text-sm text-gray-500">Compliance Dashboard</span>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </a>
              <a
                href="/dashboard/audit-logs"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Audit Logs
              </a>
              <a
                href="/dashboard/settings"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Settings
              </a>
            </nav>

            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
