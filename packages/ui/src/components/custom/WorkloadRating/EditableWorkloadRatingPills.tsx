import { useState } from 'react'
import { cn } from '../../../utils/cn'
import { WorkloadRatingDisplay } from '../WorkloadRatingDisplay'

export interface EditableWorkloadRatingPillsProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function EditableWorkloadRatingPills({
  value,
  onChange,
  disabled = false
}: EditableWorkloadRatingPillsProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  // If I drop the `max-md` and make the default 3 columns,
  // For some reason, it always renders only 3 columns...
  return (
    <div className="grid max-md:grid-cols-3 md:grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isSelected = value === rating
        const isHovered = hoveredRating === rating
        const isHighlighted = isSelected || isHovered

        return (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            onMouseEnter={() => !disabled && setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            disabled={disabled}
          >
            <WorkloadRatingDisplay
              rating={rating}
              muted={!isHighlighted}
              className={cn(
                isHighlighted && 'shadow-sm',
                'cursor-pointer',
                'w-full'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
