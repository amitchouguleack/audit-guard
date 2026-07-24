'use client'

export function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary-600">Audit Guard</h1>
            <span className="ml-2 text-sm text-gray-500">Serverless Compliance Gateway</span>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4">
              <a
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Scanner
              </a>
              <a
                href="https://github.com/amitchouguleack/audit-guard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
