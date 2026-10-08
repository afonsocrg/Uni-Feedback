import { useLocalStorage } from '@uidotdev/usehooks'
import { STORAGE_KEYS } from '../utils'

export interface FeedbackFilters {
  approvedFilter: string
  ratingFilter: string
  workloadRatingFilter: string
  hasCommentFilter: string
  schoolYearFilter: string
  /** users.id of the author; only account-linked feedback matches */
  authorFilter: number | null
}

export interface UseFeedbackFiltersReturn extends FeedbackFilters {
  setApprovedFilter: (value: string) => void
  setRatingFilter: (value: string) => void
  setWorkloadRatingFilter: (value: string) => void
  setHasCommentFilter: (value: string) => void
  setSchoolYearFilter: (value: string) => void
  setAuthorFilter: (value: number | null) => void
  resetAll: () => void
}

const DEFAULT_FILTERS: FeedbackFilters = {
  approvedFilter: 'all',
  ratingFilter: 'all',
  workloadRatingFilter: 'all',
  hasCommentFilter: 'all',
  schoolYearFilter: 'all',
  authorFilter: null
}

export function useFeedbackFilters(): UseFeedbackFiltersReturn {
  const [filters, setFilters] = useLocalStorage<FeedbackFilters>(
    STORAGE_KEYS.FEEDBACK_FILTERS,
    DEFAULT_FILTERS
  )

  const setApprovedFilter = (value: string) => {
    setFilters({ ...filters, approvedFilter: value })
  }

  const setRatingFilter = (value: string) => {
    setFilters({ ...filters, ratingFilter: value })
  }

  const setWorkloadRatingFilter = (value: string) => {
    setFilters({ ...filters, workloadRatingFilter: value })
  }

  const setHasCommentFilter = (value: string) => {
    setFilters({ ...filters, hasCommentFilter: value })
  }

  const setSchoolYearFilter = (value: string) => {
    setFilters({ ...filters, schoolYearFilter: value })
  }

  const setAuthorFilter = (value: number | null) => {
    setFilters({ ...filters, authorFilter: value })
  }

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return {
    approvedFilter: filters.approvedFilter,
    ratingFilter: filters.ratingFilter,
    workloadRatingFilter: filters.workloadRatingFilter,
    hasCommentFilter: filters.hasCommentFilter,
    schoolYearFilter: filters.schoolYearFilter,
    // Older persisted filter objects predate this key
    authorFilter: filters.authorFilter ?? null,
    setApprovedFilter,
    setRatingFilter,
    setWorkloadRatingFilter,
    setHasCommentFilter,
    setSchoolYearFilter,
    setAuthorFilter,
    resetAll
  }
}
