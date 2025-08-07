import { useState } from 'react'
import { cn } from '../../utils'
import { StarRating } from './StarRating'

type RatingLabel = [string, string, string, string, string]

const RATING_LABELS: RatingLabel = [
  'Terrible',
  'Poor',
  'Average',
  'Good',
  'Excellent'
]

interface StarRatingWithLabelProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  labels?: RatingLabel
  labelFunction?: (rating: number) => string
  displayHover?: boolean
  labelPosition?: 'bottom' | 'right'
}

export function StarRatingWithLabel({
  value,
  onChange,
  size,
  labels,
  labelFunction,
  displayHover = true,
  labelPosition = 'right'
}: StarRatingWithLabelProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  if (!labels) {
    labels = RATING_LABELS
  }

  const displayValue = displayHover && hoverValue ? hoverValue : value
  const label = labelFunction
    ? labelFunction(displayValue)
    : displayValue >= 1 && displayValue <= 5
      ? labels[displayValue - 1]
      : ''

  if (labelPosition === 'bottom') {
    return (
      <div className="flex flex-col items-start gap-1">
        <StarRating
          value={displayValue}
          onChange={onChange}
          onHover={setHoverValue}
          hoverValue={hoverValue}
          size={size}
        />
        <span
          className="text-sm text-gray-500 min-h-[20px] min-w-[70px] block pl-2"
          style={{ height: '20px' }}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3', 'flex-row items-center gap-3')}>
      <StarRating
        value={displayValue}
        onChange={onChange}
        onHover={setHoverValue}
        hoverValue={hoverValue}
        size={size}
      />
      <span
        className="text-sm text-gray-500 min-w-[70px]"
        style={{ height: '20px', display: 'inline-block' }}
      >
        {label}
      </span>
    </div>
  )
}
