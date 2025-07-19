export function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
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
