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
  // <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
  return (
    <div className="grid grid-cols-5 gap-2">
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
