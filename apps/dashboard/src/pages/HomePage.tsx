import { useAuth } from '@providers'

export function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {isAuthenticated ? (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            Welcome back!
          </h2>
          <p className="text-green-700">
            Logged in as: <strong>{user?.username}</strong> ({user?.email})
          </p>
          {user?.superuser && (
            <p className="text-green-700 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Superuser
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            You are not authenticated. Please log in to access the dashboard.
          </p>
        </div>
      )}

      <p className="text-gray-600">
        This is a placeholder for the admin dashboard. Future features will
        include:
      </p>
      <ul className="mt-4 list-disc list-inside text-gray-600">
        <li>Course management</li>
        <li>Feedback moderation</li>
        <li>User analytics</li>
        <li>System configuration</li>
      </ul>
    </div>
  )
}
