import type { Course, Degree, Faculty } from '@uni-feedback/db/schema'
import { Home } from 'lucide-react'
import { userPreferences } from '../../utils/userPreferences'
import { GenericBreadcrumb, type BreadcrumbItemData } from './GenericBreadcrumb'

interface BreadcrumbProps {
  className?: string
  faculty?: Faculty
  degree?: Degree
  course?: Course
}

export function Breadcrumb({
  className = '',
  faculty,
  degree,
  course
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

  const handleDegreeClick = () => {
    // Update preferences to degree level
    userPreferences.set({
      lastSelectedFacultySlug: faculty?.slug ?? undefined,
      lastSelectedDegreeSlug: degree?.slug ?? undefined,
      lastVisitedPath: `/${faculty?.slug}/${degree?.slug}`
    })
  }

  const items: BreadcrumbItemData[] = [
    {
      label: (
        <>
          <Home className="h-3 w-3 mr-1" />
          Select Uni
        </>
      ),
      href: '/browse',
      onClick: handleHomeClick
    }
  ]

  if (faculty) {
    items.push({
      label: faculty.shortName,
      href: `/${faculty.slug}`,
      onClick: handleFacultyClick
    })
  }

  if (faculty && degree) {
    items.push({
      label: degree.acronym,
      href: course ? `/${faculty.slug}/${degree.slug}` : undefined,
      onClick: course ? handleDegreeClick : undefined,
      isActive: !course
    })
  }

  if (faculty && degree && course) {
    items.push({
      label: course.acronym,
      isActive: true
    })
  }

  return <GenericBreadcrumb items={items} className={className} />
}
