import { useState } from 'react'
import { StarRatingWithLabel, StarRatingWithLabelProps } from './StarRatingWithLabel'

export interface EditableStarRatingProps extends StarRatingWithLabelProps {
  onChange: (value: number) => void
  disabled?: boolean
}

export function EditableStarRating({
  onChange,
  disabled = false,
  ...starRatingWithLabelProps
}: EditableStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  if (disabled) {
    return (
      <StarRatingWithLabel
        {...starRatingWithLabelProps}
        variant="default"
      />
    )
  }

  const displayValue = hoverValue ?? starRatingWithLabelProps.value
  const variant = hoverValue !== null ? 'muted' : 'default'
  const size = starRatingWithLabelProps.size || 'md'
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  return (
    <div 
      className="relative"
      onMouseLeave={() => setHoverValue(null)}
    >
      <StarRatingWithLabel
        {...starRatingWithLabelProps}
        value={displayValue}
        variant={variant}
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