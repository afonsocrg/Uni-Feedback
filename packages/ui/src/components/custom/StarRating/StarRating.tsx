export interface StarRatingProps {
  value: number
  variant?: 'default' | 'muted'
  size?: 'sm' | 'md' | 'lg'
}

export function StarRating({
  value,
  variant = 'default',
  size = 'md'
}: StarRatingProps) {
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  const displayValue = Math.round(value)
  const yellowTone =
    variant === 'default' ? 'text-yellow-500' : 'text-yellow-500/70'

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <span
          key={index}
          className={`${sizeClasses[size]} ${
            index < displayValue ? yellowTone : 'text-gray-200'
          }`}
        >
          ★
        </span>
      ))}
    </div>
  )
}
