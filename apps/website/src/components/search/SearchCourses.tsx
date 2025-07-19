import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useDegreeCourseGroups } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

type SortOption = 'rating' | 'alphabetical' | 'reviews'

interface SearchCoursesProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  availableTerms: string[]
  selectedTerm: string
  setSelectedTerm: (term: string) => void
  selectedCourseGroupId: number | null
  setSelectedCourseGroupId: (courseGroupId: number | null) => void
  sortBy: SortOption
  setSortBy: (sort: SortOption) => void
  degreeId: number
}

export function SearchCourses({
  searchQuery,
  setSearchQuery,
  availableTerms,
  selectedTerm,
  setSelectedTerm,
  selectedCourseGroupId,
  setSelectedCourseGroupId,
  sortBy,
  setSortBy,
  degreeId
}: SearchCoursesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: courseGroups } = useDegreeCourseGroups(degreeId)

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTerm('')
    setSelectedCourseGroupId(null)
    setSortBy('rating')
  }

  const hasActiveFilters = selectedTerm !== '' || selectedCourseGroupId !== null

  return (
    <div className="bg-white rounded-xl shadow-md px-6 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              id="search"
              type="text"
              placeholder="Search by name or acronym..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:border-transparent bg-gray-50 text-gray-700 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`self-end px-4 py-2 text-sm font-medium focus:outline-none flex items-center gap-2 ${
              hasActiveFilters
                ? 'text-primaryBlue bg-blue-50 rounded-lg border border-blue-100'
                : 'text-primaryBlue hover:primaryBlue/80'
            }`}
          >
            <span>
              {isExpanded
                ? 'Hide Filters'
                : hasActiveFilters
                  ? 'Filters Active'
                  : 'Show Filters'}
            </span>
            {hasActiveFilters && !isExpanded && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primaryBlue text-white rounded-full">
                {(selectedTerm !== '' ? 1 : 0) +
                  (selectedCourseGroupId !== null ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6 pt-4 pb-2 px-2">
                <div className="flex-1 flex flex-col min-w-[120px]">
                  <label
                    htmlFor="term"
                    className="text-xs font-semibold text-gray-500 mb-1"
                  >
                    Term
                  </label>
                  <Select
                    value={selectedTerm || 'all'}
                    onValueChange={(value) =>
                      setSelectedTerm(value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {availableTerms.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col min-w-[160px]">
                  <label
                    htmlFor="courseGroup"
                    className="text-xs font-semibold text-gray-500 mb-1"
                  >
                    Course Group
                  </label>
                  <Select
                    value={selectedCourseGroupId?.toString() || 'all'}
                    onValueChange={(value) =>
                      setSelectedCourseGroupId(
                        value === 'all' ? null : Number(value)
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {courseGroups?.map((courseGroup) => (
                        <SelectItem
                          key={courseGroup.id}
                          value={courseGroup.id.toString()}
                        >
                          {courseGroup.name}
                        </SelectItem>
                      )) ?? []}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 flex flex-col min-w-[160px]">
                  <label
                    htmlFor="sort"
                    className="text-xs font-semibold text-gray-500 mb-1"
                  >
                    Sort by
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as SortOption)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end min-w-[120px] mt-2 md:mt-0">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
