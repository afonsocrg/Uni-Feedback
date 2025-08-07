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
  variant?: 'default' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  labels?: RatingLabel
  labelFunction?: (rating: number) => string
  labelPosition?: 'bottom' | 'right'
}

export function StarRatingWithLabel({
  value,
  variant = 'default',
  size,
  labels,
  labelFunction,
  labelPosition = 'right'
}: StarRatingWithLabelProps) {
  if (!labels) {
    labels = RATING_LABELS
  }

  const label = labelFunction
    ? labelFunction(value)
    : value >= 1 && value <= 5
      ? labels[value - 1]
      : ''

  if (labelPosition === 'bottom') {
    return (
      <div className="flex flex-col items-start gap-1">
        <StarRating
          value={value}
          variant={variant}
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
        value={value}
        variant={variant}
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
