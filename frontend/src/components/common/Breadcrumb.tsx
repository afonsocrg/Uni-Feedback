import { useUrlNavigation } from '@hooks'
import { buildFacultyUrl, STORAGE_KEYS } from '@utils'
import { ChevronRight, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BreadcrumbItem } from './BreadcrumbItem'

interface BreadcrumbProps {
  className?: string
}

export function Breadcrumb({ className = '' }: BreadcrumbProps) {
  const navigate = useNavigate()
  const { faculty, degree } = useUrlNavigation()

  const handleFacultyClick = () => {
    // Clear both selected faculty and degree when going back to home
    localStorage.removeItem(STORAGE_KEYS.SELECTED_FACULTY_ID)
    localStorage.removeItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
    navigate('/')
  }

  const handleDegreeClick = () => {
    if (faculty) {
      // Clear selected degree when going back to faculty page
      localStorage.removeItem(STORAGE_KEYS.SELECTED_DEGREE_ID)
      navigate(buildFacultyUrl(faculty))
    }
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      <BreadcrumbItem onClick={handleFacultyClick}>
        <Home className="h-4 w-4 mr-1" />
        Select Uni
      </BreadcrumbItem>

      {faculty && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <BreadcrumbItem onClick={handleDegreeClick}>
            {faculty.short_name}
          </BreadcrumbItem>
        </>
      )}

      {faculty && degree && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <BreadcrumbItem isActive>{degree.acronym}</BreadcrumbItem>
        </>
      )}
    </nav>
  )
}
