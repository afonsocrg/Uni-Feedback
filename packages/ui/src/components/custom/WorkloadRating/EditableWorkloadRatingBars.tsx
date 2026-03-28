import { getWorkloadLabel } from '@uni-feedback/utils'
import { useState } from 'react'
import { cn } from '../../../utils/cn'

export interface EditableWorkloadRatingBarsProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  showLabel?: boolean
}

export function EditableWorkloadRatingBars({
  value,
  onChange,
  disabled = false,
  showLabel = true
}: EditableWorkloadRatingBarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0

  // Match the star rating size (text-3xl = 1.875rem = 30px)
  const barMaxHeight = '1.875rem' // 30px - matches lg star size
  const barWidth = '1.875rem' // 30px - matches lg star size

  // Bar heights as percentages of max height (ascending from left to right)
  const barHeightPercentages = [0.3, 0.5, 0.7, 0.85, 1.0]

  return (
    <div
      className="flex items-end gap-3"
      onMouseLeave={() => setHoverValue(null)}
    >
      <div className="flex items-end gap-1" style={{ height: barMaxHeight }}>
        {[1, 2, 3, 4, 5].map((rating) => {
          // Invert rating: bar 1 = rating 5 (very light), bar 5 = rating 1 (very heavy)
          const ratingValue = 6 - rating
          // Fill cumulative: if rating 4 is selected, bars 1-4 fill
          const isFilled = displayValue > 0 && rating <= 6 - displayValue

          return (
            <button
              key={rating}
              type="button"
              onClick={() => !disabled && onChange(ratingValue)}
              onMouseEnter={() => !disabled && setHoverValue(ratingValue)}
              disabled={disabled}
              className={cn(
                'rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primaryBlue focus:ring-offset-1',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                isFilled ? 'bg-primaryBlue' : 'bg-gray-200'
              )}
              style={{
                width: barWidth,
                height: `calc(${barMaxHeight} * ${barHeightPercentages[rating - 1]})`
              }}
              aria-label={`Rate workload as ${getWorkloadLabel(ratingValue)}`}
            />
          )
        })}
      </div>
      {showLabel && displayValue > 0 && (
        <div className="text-sm text-gray-700">
          {getWorkloadLabel(displayValue)}
        </div>
      )}
    </div>
  )
}
