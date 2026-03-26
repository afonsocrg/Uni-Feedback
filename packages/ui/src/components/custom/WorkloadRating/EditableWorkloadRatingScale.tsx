import { Dumbbell } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../utils/cn'
import { WorkloadRatingDisplay } from '../WorkloadRatingDisplay'

export interface EditableWorkloadRatingScaleProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function EditableWorkloadRatingScale({
  value,
  onChange,
  disabled = false,
  size = 'md',
  showLabel = true
}: EditableWorkloadRatingScaleProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0
  const isHovering = hoverValue !== null

  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6'
  }

  return (
    <div
      className="flex items-center gap-3"
      onMouseLeave={() => setHoverValue(null)}
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((position) => {
          // Invert scale: clicking position 1 = rating 5 (very light), position 5 = rating 1 (very heavy)
          const ratingValue = 6 - position
          // Fill from left to right: fewer filled = lighter workload
          const isFilled = displayValue > 0 && position <= 6 - displayValue

          return (
            <button
              key={position}
              type="button"
              onClick={() => !disabled && onChange(ratingValue)}
              onMouseEnter={() => !disabled && setHoverValue(ratingValue)}
              disabled={disabled}
              className="focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:ring-offset-1 rounded disabled:cursor-not-allowed"
            >
              <Dumbbell
                className={cn(
                  sizeClasses[size],
                  'transition-colors',
                  disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                  isFilled
                    ? 'fill-primaryBlue text-primaryBlue'
                    : 'fill-gray-300 text-gray-300'
                )}
              />
            </button>
          )
        })}
      </div>
      {showLabel && displayValue > 0 && (
        <div className="text-sm">
          <WorkloadRatingDisplay rating={displayValue} />
        </div>
      )}
    </div>
  )
}
