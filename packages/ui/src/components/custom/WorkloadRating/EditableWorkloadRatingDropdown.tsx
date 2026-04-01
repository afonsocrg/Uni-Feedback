import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../utils/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../../shadcn/popover'
import { WorkloadRatingDisplay } from '../WorkloadRatingDisplay'

export interface EditableWorkloadRatingDropdownProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EditableWorkloadRatingDropdown({
  value,
  onChange,
  disabled = false,
  size = 'md'
}: EditableWorkloadRatingDropdownProps) {
  const [open, setOpen] = useState(false)

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const handleSelect = (rating: number) => {
    onChange(rating)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 transition-opacity',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer'
          )}
        >
          <WorkloadRatingDisplay
            rating={value || 3}
            muted={value === 0}
            className={sizeClasses[size]}
          />
          <ChevronDown
            className={cn(
              'transition-transform',
              open && 'rotate-180',
              size === 'sm' && 'size-3',
              size === 'md' && 'size-4',
              size === 'lg' && 'size-5'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-1">
          {[1, 2, 3, 4, 5].reverse().map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleSelect(rating)}
              className={cn(
                'text-left transition-opacity hover:opacity-80',
                disabled && 'cursor-not-allowed opacity-50',
                !disabled && 'cursor-pointer'
              )}
            >
              <WorkloadRatingDisplay rating={rating} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
