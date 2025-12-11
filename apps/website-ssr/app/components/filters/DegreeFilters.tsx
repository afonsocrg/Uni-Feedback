import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { FilterGroup } from './FilterGroup'

interface DegreeFiltersProps {
  availableTypes: string[]
  selectedType: string | null
  onTypeChange: (type: string | null) => void
}

export function DegreeFilters({
  availableTypes,
  selectedType,
  onTypeChange
}: DegreeFiltersProps) {
  return (
    <FilterGroup label="Degree Type">
      <Select
        value={selectedType || 'all'}
        onValueChange={(value) => onTypeChange(value === 'all' ? null : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {availableTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterGroup>
  )
}
