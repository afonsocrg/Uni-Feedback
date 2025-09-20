import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router'
import { useLastVisitedPath } from '../hooks/useLastVisitedPath'

export function Header() {
  const lastVisitedPath = useLastVisitedPath()

  return (
    <header className="bg-primaryBlue text-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          to={lastVisitedPath}
          className="flex items-center gap-2 text-xl font-medium hover:opacity-80 transition-opacity"
        >
          <GraduationCap className="h-6 w-6" />
          <span>Uni Feedback</span>
        </Link>
      </div>
    </header>
  )
}