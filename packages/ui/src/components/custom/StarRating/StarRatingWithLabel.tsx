import { cn } from '../../../utils'
import { StarRating, StarRatingProps } from './StarRating'

type RatingLabel = [string, string, string, string, string]

export const RATING_LABELS: RatingLabel = [
  'Terrible',
  'Poor',
  'Average',
  'Good',
  'Excellent'
]

export const defaultLabelFunction = (rating: number): string =>
  rating >= 1 && rating <= 5 ? RATING_LABELS[rating - 1] : ''

export interface StarRatingWithLabelProps extends StarRatingProps {
  labelFunction?: (rating: number) => string
  labelPosition?: 'bottom' | 'right'
}

export function StarRatingWithLabel({
  labelFunction = defaultLabelFunction,
  labelPosition = 'right',
  ...starRatingProps
}: StarRatingWithLabelProps) {
  const { value } = starRatingProps
  const label = labelFunction(value)

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
