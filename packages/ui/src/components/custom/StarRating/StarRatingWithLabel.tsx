import { cn } from '../../../utils'
import { StarRating, StarRatingProps } from './StarRating'

type RatingLabel = [string, string, string, string, string]

const RATING_LABELS: RatingLabel = [
  'Terrible',
  'Poor',
  'Average',
  'Good',
  'Excellent'
]

export interface StarRatingWithLabelProps extends StarRatingProps {
  labels?: RatingLabel
  labelFunction?: (rating: number) => string
  labelPosition?: 'bottom' | 'right'
}

export function StarRatingWithLabel({
  labels,
  labelFunction,
  labelPosition = 'right',
  ...starRatingProps
}: StarRatingWithLabelProps) {
  if (!labels) {
    labels = RATING_LABELS
  }

  const { value } = starRatingProps

  const label = labelFunction
    ? labelFunction(value)
    : value >= 1 && value <= 5
      ? labels[value - 1]
      : ''

  if (labelPosition === 'bottom') {
    return (
      <div className="flex flex-col items-start gap-1">
        <StarRating {...starRatingProps} />
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
      <StarRating {...starRatingProps} />
      <span
        className="text-sm text-gray-500 min-w-[70px]"
        style={{ height: '20px', display: 'inline-block' }}
      >
        {label}
      </span>
    </div>
  )
}
