import {
  Badge,
  Chip,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '~/utils'

export interface FilterOption {
  value: string
  label: string
}

interface SearchableFilterChipProps {
  label: string
  options: FilterOption[]
  selectedValue: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  searchPlaceholder?: string
}

// Consistent color scheme for active filters
const ACTIVE_FILTER_COLORS = {
  bg: '#E3F2FD',
  text: '#23729f',
  border: '#23729f'
}

export function SearchableFilterChip({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder,
  searchPlaceholder = 'Search...'
}: SearchableFilterChipProps) {
  const [open, setOpen] = useState(false)
  const popoverContentRef = useRef<HTMLDivElement>(null)

  // Close popover when scrolling outside of it
  useEffect(() => {
    if (!open) return

    const handleScroll = (event: Event) => {
      const target = event.target as Node
      if (
        popoverContentRef.current &&
        !popoverContentRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('scroll', handleScroll, true)
    return () => document.removeEventListener('scroll', handleScroll, true)
  }, [open])

  const selectedOption = selectedValue
    ? options.find((opt) => opt.value === selectedValue)
    : null

  const displayLabel = selectedOption
    ? selectedOption.label
    : placeholder || label
  const chipColor = selectedValue ? undefined : 'gray'

  const handleSelect = (value: string) => {
    onValueChange(value === selectedValue ? null : value)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(null)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer max-w-full">
          {selectedValue ? (
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 flex items-center gap-1.5 max-w-full"
              style={{
                backgroundColor: ACTIVE_FILTER_COLORS.bg,
                color: ACTIVE_FILTER_COLORS.text,
                borderColor: ACTIVE_FILTER_COLORS.border
              }}
            >
              <span className="truncate">{displayLabel}</span>
              <button
                onClick={handleClear}
                className="hover:bg-primaryBlue/10 rounded-sm p-0.5 transition-colors flex-shrink-0"
                aria-label="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ) : (
            <Chip label={displayLabel} color={chipColor} size="sm" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverContentRef}
        className="w-[300px] p-0"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          filter={(value, search) => {
            // Normalize to NFD form and remove diacritical marks for accent-insensitive matching
            const normalize = (str: string) =>
              str
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
            if (normalize(value).includes(normalize(search))) {
              return 1
            }
            return 0
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className={cn(
                    'cursor-pointer',
                    option.value === selectedValue &&
                      'bg-blue-50 text-primaryBlue font-medium'
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                  {option.value === selectedValue && (
                    <Check className="w-4 h-4" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
