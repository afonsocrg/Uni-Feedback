import { cn } from '../../../utils/cn'
import { WorkloadRatingDisplay } from '../WorkloadRatingDisplay'

export interface EditableWorkloadRatingListProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EditableWorkloadRatingList({
  value,
  onChange,
  disabled = false
}: EditableWorkloadRatingListProps) {
  return (
    <div className="space-y-0.5">
      {[1, 2, 3, 4, 5].reverse().map((rating) => {
        const isSelected = value === rating

        return (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            disabled={disabled}
            className={cn(
              'w-full text-left px-2.5 py-1 rounded-md transition-colors',
              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              isSelected
                ? 'bg-primaryBlue/10 border-2 border-primaryBlue'
                : 'border-2 border-transparent hover:bg-gray-100'
            )}
          >
            <WorkloadRatingDisplay rating={rating} muted={!isSelected} />
          </button>
        )
      })}
    </div>
  )
}
