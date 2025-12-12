import type { Degree, Faculty } from '@uni-feedback/db/schema'
import type { ReactNode } from 'react'
import { Breadcrumb } from '../common/Breadcrumb'

interface BrowsePageLayoutProps {
  title: string
  subtitle?: string
  faculty?: Faculty
  degree?: Degree
  searchBar?: ReactNode
  filterChips?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

export function BrowsePageLayout({
  title,
  subtitle,
  faculty,
  degree,
  searchBar,
  filterChips,
  actions,
  children
}: BrowsePageLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb Section */}
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb faculty={faculty} degree={degree} />
      </div>

      {/* Main Content Section */}
      <section className="py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-3">
              <h1 className="text-base md:text-lg font-normal text-gray-500">
                {title}
              </h1>
            </div>

            {/* Search Bar */}
            {searchBar && <div className="mb-4">{searchBar}</div>}

            {/* Filter Chips */}
            {filterChips && <div className="mb-6">{filterChips}</div>}

            {/* Main Content Grid */}
            {children}

            {/* Actions (e.g., "Missing degree?" alert) */}
            {actions && <div className="mt-8">{actions}</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
