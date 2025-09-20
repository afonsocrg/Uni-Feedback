import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { ChevronRight, Home } from 'lucide-react'
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
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      <BreadcrumbItem href="/">
        <Home className="h-4 w-4 mr-1" />
        Select Uni
      </BreadcrumbItem>

      {faculty && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <BreadcrumbItem href={`/${faculty.slug}`}>
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
