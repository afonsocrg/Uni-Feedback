export interface DegreeWithCounts {
  id: number
  type: string
  name: string
  acronym: string
  slug: string | null
  courseCount: number
  feedbackCount: number
}

/**
 * Shared by every degree-listing component (`DegreeCardGrid`, `DegreeTable`),
 * so the faculty page can swap one for another without touching its filtering
 * or sorting. Listings only decide how degrees look: they never filter or sort
 * what they are handed.
 *
 * `getHref` and `onSelect` stay with the page because they carry routing and
 * preference-persistence concerns, which are not a listing's business.
 */
export interface DegreeListingProps {
  degrees: DegreeWithCounts[]
  getHref: (degree: DegreeWithCounts) => string
  onSelect: (degree: DegreeWithCounts) => void
}
