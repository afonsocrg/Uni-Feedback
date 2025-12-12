import { Chip, Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { Check } from 'lucide-react'
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
}

export function FilterChip({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder
}: FilterChipProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = selectedValue
    ? options.find((opt) => opt.value === selectedValue)
    : null

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || label
  const chipColor = selectedValue ? undefined : 'gray'

  const handleSelect = (value: string | null) => {
    onValueChange(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <Chip label={displayLabel} color={chipColor} size="sm" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" sideOffset={8}>
        {selectedValue && (
          <>
            <button
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
            >
              Clear
            </button>
            <div className="border-b border-gray-200 my-1" />
          </>
        )}
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
