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
    // Clear user preferences and navigate to browse page
    userPreferences.set({
      lastSelectedFacultySlug: undefined,
      lastSelectedDegreeSlug: undefined,
      lastVisitedPath: '/browse'
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
    <nav
      className={`flex items-center space-x-1 text-xs text-gray-500 ${className}`}
    >
      <BreadcrumbItem href="/browse" onClick={handleHomeClick}>
        <Home className="h-3 w-3 mr-1" />
        Select Uni
      </BreadcrumbItem>

      {faculty && (
        <>
          <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />
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
          <ChevronRight className="h-3 w-3 text-gray-400 mx-1" />
          <BreadcrumbItem isActive>{degree.acronym}</BreadcrumbItem>
        </>
      )}
    </nav>
  )
}
