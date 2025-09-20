import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { ChevronRight, Home } from 'lucide-react'
import { userPreferences } from '../../utils/userPreferences'
import { BreadcrumbItem } from './BreadcrumbItem'

interface BreadcrumbProps {
  className?: string
  faculty?: Faculty
  degree?: Degree
}

export function Breadcrumb({
  className = '',
  faculty,
  degree
}: BreadcrumbProps) {
  const handleHomeClick = () => {
    // Clear user preferences so they stay on home page
    userPreferences.set({
      lastSelectedFacultySlug: undefined,
      lastSelectedDegreeSlug: undefined,
      lastVisitedPath: '/'
    })
  }

  const handleFacultyClick = () => {
    // Update preferences to faculty level only
    userPreferences.set({
      lastSelectedFacultySlug: faculty?.slug ?? undefined,
      lastSelectedDegreeSlug: undefined,
      lastVisitedPath: `/${faculty?.slug}`
    })
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      <BreadcrumbItem href="/" onClick={handleHomeClick}>
        <Home className="h-4 w-4 mr-1" />
        Select Uni
      </BreadcrumbItem>

      {faculty && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <BreadcrumbItem
            href={`/${faculty.slug}`}
            onClick={handleFacultyClick}
          >
            {faculty.shortName}
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
