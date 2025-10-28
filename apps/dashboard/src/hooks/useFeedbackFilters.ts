import { useLocalStorage } from '@uidotdev/usehooks'
import { STORAGE_KEYS } from '../utils'

export interface FeedbackFilters {
  approvedFilter: string
  ratingFilter: string
  workloadRatingFilter: string
  hasCommentFilter: string
  schoolYearFilter: string
}

export interface UseFeedbackFiltersReturn extends FeedbackFilters {
  setApprovedFilter: (value: string) => void
  setRatingFilter: (value: string) => void
  setWorkloadRatingFilter: (value: string) => void
  setHasCommentFilter: (value: string) => void
  setSchoolYearFilter: (value: string) => void
  resetAll: () => void
}

const DEFAULT_FILTERS: FeedbackFilters = {
  approvedFilter: 'all',
  ratingFilter: 'all',
  workloadRatingFilter: 'all',
  hasCommentFilter: 'all',
  schoolYearFilter: 'all'
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

  const resetAll = () => {
    setFilters(DEFAULT_FILTERS)
  }

  return {
    approvedFilter: filters.approvedFilter,
    ratingFilter: filters.ratingFilter,
    workloadRatingFilter: filters.workloadRatingFilter,
    hasCommentFilter: filters.hasCommentFilter,
    schoolYearFilter: filters.schoolYearFilter,
    setApprovedFilter,
    setRatingFilter,
    setWorkloadRatingFilter,
    setHasCommentFilter,
    setSchoolYearFilter,
    resetAll
  }
}
