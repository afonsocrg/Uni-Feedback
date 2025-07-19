interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  onHover?: (value: number | null) => void
  hoverValue?: number | null
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({
  value,
  onChange,
  onHover,
  hoverValue,
  size = 'md'
}: StarRatingProps) {
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  const displayValue = Math.round(hoverValue ?? value)
  const yellowTone =
    hoverValue === null ? 'text-yellow-500' : 'text-yellow-500/80'

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={`${sizeClasses[size]} ${
            index < displayValue ? yellowTone : 'text-gray-200'
          } ${onChange ? 'cursor-pointer' : ''}`}
          onClick={() => onChange?.(index + 1)}
          onMouseEnter={() => onHover?.(index + 1)}
          onMouseLeave={() => onHover?.(null)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
