import { useState } from 'react'
import { StarRatingWithLabel } from './StarRatingWithLabel'

type RatingLabel = [string, string, string, string, string]

interface EditableStarRatingProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  labels?: RatingLabel
  labelFunction?: (rating: number) => string
  labelPosition?: 'bottom' | 'right'
}

export function EditableStarRating({
  value,
  onChange,
  disabled = false,
  size = 'md',
  labels,
  labelFunction,
  labelPosition = 'right'
}: EditableStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  if (disabled) {
    return (
      <StarRatingWithLabel
        value={value}
        variant="default"
        size={size}
        labels={labels}
        labelFunction={labelFunction}
        labelPosition={labelPosition}
      />
    )
  }

  const displayValue = hoverValue ?? value
  const variant = hoverValue !== null ? 'muted' : 'default'
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div 
      className="relative"
      onMouseLeave={() => setHoverValue(null)}
    >
      <StarRatingWithLabel
        value={displayValue}
        variant={variant}
        size={size}
        labels={labels}
        labelFunction={labelFunction}
        labelPosition={labelPosition}
      />
      <div className="absolute top-0 left-0 flex">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`cursor-pointer ${sizeClasses[size]}`}
            style={{ width: '1em' }}
            onMouseEnter={() => setHoverValue(index + 1)}
            onClick={() => onChange(index + 1)}
          >
            <span className="invisible">★</span>
          </div>
        ))}
      </div>
    </div>
  )
}