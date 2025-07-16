import { GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header() {
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
      </div>
    </header>
  )
}
