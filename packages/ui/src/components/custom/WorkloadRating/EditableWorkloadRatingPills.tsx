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
  // If I drop the `max-md` and make the default 3 columns,
  // For some reason, it always renders only 3 columns...
  return (
    <div className="grid max-md:grid-cols-3 md:grid-cols-5 gap-2">
      {[5, 4, 3, 2, 1].map((rating) => {
        const isSelected = value === rating

        return (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            disabled={disabled}
          >
            <WorkloadRatingDisplay
              rating={rating}
              muted={!isSelected}
              className={cn(
                isSelected && 'shadow-sm',
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
