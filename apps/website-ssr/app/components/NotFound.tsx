import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { LandingLayout } from '~/components/landing'

export function NotFound() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <LandingLayout>
      <div className="flex flex-col items-center justify-center px-4 py-16 min-h-screen">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800">
            Lost in space?
          </h2>
          <p className="text-lg text-gray-600">
            We couldn't find the page you were looking for. But don't worry, you
            can always navigate back!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go back</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primaryBlue text-white rounded-lg hover:bg-primaryBlue/90 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Take me home</span>
            </Link>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
}
