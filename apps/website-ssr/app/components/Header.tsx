import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router'
import { useLastVisitedPath } from '~/hooks/useLastVisitedPath'

export function Header() {
  const lastVisitedPath = useLastVisitedPath()

  // Determine browse link: use last visited path if it's a browse page, otherwise /browse
  const browseLink = lastVisitedPath !== '/' ? lastVisitedPath : '/browse'

  return (
    <header className="bg-primaryBlue text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-medium hover:opacity-80 transition-opacity"
        >
          <GraduationCap className="h-6 w-6" />
          <span>Uni Feedback</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            to={browseLink}
            className="hover:opacity-80 transition-opacity font-medium"
          >
            Browse
          </Link>
          <Link
            to="/feedback/new"
            className="hover:opacity-80 transition-opacity font-medium"
          >
            Give Feedback
          </Link>
        </nav>
      </div>
    </header>
  )
}
