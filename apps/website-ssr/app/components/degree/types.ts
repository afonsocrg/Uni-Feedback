import type { DegreeType } from '@uni-feedback/db/schema'

export interface DegreeWithCounts {
  id: number
  type: DegreeType
  name: string
  acronym: string
  slug: string | null
  courseCount: number
  feedbackCount: number
}

/**
 * Props of the degree listing (`DegreeTable`). Listings only decide how degrees
 * look: they never filter or sort what they are handed.
 *
 * `getHref` and `onSelect` stay with the page because they carry routing and
 * preference-persistence concerns, which are not a listing's business.
 */
export interface DegreeListingProps {
  degrees: DegreeWithCounts[]
  getHref: (degree: DegreeWithCounts) => string
  onSelect: (degree: DegreeWithCounts) => void
}
