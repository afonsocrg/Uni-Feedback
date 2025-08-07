import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm">Uni Feedback Dashboard</div>
          <div className="flex gap-6">
            <Link
              to="/terms"
              className="text-gray-700 hover:underline text-sm transition-all"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="text-gray-700 hover:underline text-sm transition-all"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
