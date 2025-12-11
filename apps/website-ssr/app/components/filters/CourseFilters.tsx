import type { CourseGroup } from '@uni-feedback/db/schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { FilterGroup } from './FilterGroup'

interface CourseGroupWithIds extends CourseGroup {
  courseIds: number[]
}

type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

interface CourseFiltersProps {
  availableTerms: string[]
  selectedTerm: string | null
  onTermChange: (term: string | null) => void

  courseGroups: CourseGroupWithIds[]
  selectedCourseGroupId: number | null
  onCourseGroupChange: (id: number | null) => void

  mandatoryExamFilter: boolean | null
  onMandatoryExamChange: (filter: boolean | null) => void

  sortBy: SortOption
  onSortByChange: (sort: SortOption) => void
}

export function CourseFilters({
  availableTerms,
  selectedTerm,
  onTermChange,
  courseGroups,
  selectedCourseGroupId,
  onCourseGroupChange,
  mandatoryExamFilter,
  onMandatoryExamChange,
  sortBy,
  onSortByChange
}: CourseFiltersProps) {
  return (
    <>
      <FilterGroup label="Term">
        <Select
          value={selectedTerm || 'all'}
          onValueChange={(value) =>
            onTermChange(value === 'all' ? null : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            {availableTerms.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Course Group">
        <Select
          value={selectedCourseGroupId?.toString() || 'all'}
          onValueChange={(value) =>
            onCourseGroupChange(value === 'all' ? null : Number(value))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {courseGroups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Exam Type">
        <Select
          value={
            mandatoryExamFilter === null
              ? 'all'
              : mandatoryExamFilter.toString()
          }
          onValueChange={(value) =>
            onMandatoryExamChange(value === 'all' ? null : value === 'true')
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has Mandatory Exam</SelectItem>
            <SelectItem value="false">No Mandatory Exam</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="Sort By">
        <Select
          value={sortBy}
          onValueChange={(value) => onSortByChange(value as SortOption)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rating</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="reviews">Most Reviews</SelectItem>
            <SelectItem value="workload">Workload Rating</SelectItem>
          </SelectContent>
        </Select>
      </FilterGroup>
    </>
  )
}
