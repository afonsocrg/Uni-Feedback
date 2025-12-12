import {
  Badge,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { ArrowDownUp, Check, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '~/utils'

export interface FilterOption {
  value: string
  label: string
}

interface FilterChipProps {
  label: string
  options: FilterOption[]
  selectedValue: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  variant?: 'filter' | 'sort'
}

// Consistent color scheme for active filters
const ACTIVE_FILTER_COLORS = {
  bg: '#E3F2FD', // Light blue
  text: '#23729f', // primaryBlue
  border: '#23729f' // primaryBlue
}

// Color scheme for sort chips - more prominent
const SORT_COLORS = {
  bg: '#23729f', // primaryBlue
  text: '#FFFFFF', // White
  border: '#23729f'
}

export function FilterChip({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  variant = 'filter'
}: FilterChipProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = selectedValue
    ? options.find((opt) => opt.value === selectedValue)
    : null

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || label
  const chipColor = selectedValue ? undefined : 'gray'
  const isSort = variant === 'sort'

  const handleSelect = (value: string | null) => {
    onValueChange(value)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
  }

  // Sort chips always show as active with special styling
  const colors = isSort ? SORT_COLORS : ACTIVE_FILTER_COLORS
  const showAsActive = isSort || selectedValue

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          {showAsActive ? (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5 flex items-center gap-1.5',
                isSort && 'font-medium'
              )}
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border
              }}
            >
              {isSort && <ArrowDownUp className="w-3 h-3" />}
              <span>{displayLabel}</span>
              {!isSort && selectedValue && (
                <button
                  onClick={handleClear}
                  className="hover:bg-primaryBlue/10 rounded-sm p-0.5 transition-colors"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </Badge>
          ) : (
            <Chip label={displayLabel} color={chipColor} size="sm" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" sideOffset={8}>
        <div className="max-h-[300px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm transition-colors flex items-center justify-between',
                option.value === selectedValue
                  ? 'bg-blue-50 text-primaryBlue font-medium'
                  : 'text-gray-700'
              )}
            >
              <span>{option.label}</span>
              {option.value === selectedValue && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
