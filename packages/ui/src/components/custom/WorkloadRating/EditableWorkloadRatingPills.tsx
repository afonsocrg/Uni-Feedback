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
  return (
    <div className="flex gap-2 overflow-x-auto flex-wrap">
      {[1, 2, 3, 4, 5].map((rating) => {
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
              className={cn(isSelected && 'shadow-sm', 'cursor-pointer')}
            />
          </button>
        )
      })}
    </div>
  )
}
