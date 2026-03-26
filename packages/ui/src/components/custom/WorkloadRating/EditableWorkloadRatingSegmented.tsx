import { getWorkloadLabel, getWorkloadColor } from '@uni-feedback/utils'
import { cn } from '../../../utils/cn'

export interface EditableWorkloadRatingSegmentedProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function EditableWorkloadRatingSegmented({
  value,
  onChange,
  disabled = false,
  size = 'md'
}: EditableWorkloadRatingSegmentedProps) {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border-2 border-gray-300 overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {[1, 2, 3, 4, 5].map((rating, index) => {
        const isSelected = value === rating
        const label = getWorkloadLabel(rating)
        const colorClass = getWorkloadColor(rating)

        return (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            disabled={disabled}
            className={cn(
              'font-medium transition-all whitespace-nowrap',
              sizeClasses[size],
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              index > 0 && 'border-l-2 border-gray-300',
              isSelected
                ? colorClass
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
