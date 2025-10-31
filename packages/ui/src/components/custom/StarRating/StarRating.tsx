export interface StarRatingProps {
  value: number
  variant?: 'default' | 'muted'
  size?: 'sm' | 'md' | 'lg'
  showHalfStars?: boolean
}

export function StarRating({
  value,
  variant = 'default',
  size = 'md',
  showHalfStars = false
}: StarRatingProps) {
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }

  // Round to nearest 0.5 if half stars enabled, otherwise round to integer
  const displayValue = showHalfStars
    ? Math.round(value * 2) / 2
    : Math.round(value)

  const yellowTone =
    variant === 'default' ? 'text-yellow-500' : 'text-yellow-500/70'

  const renderStar = (index: number) => {
    const fillAmount = Math.min(Math.max(displayValue - index, 0), 1)

    if (!showHalfStars || fillAmount === 0 || fillAmount === 1) {
      // Full or empty star (original behavior)
      return (
        <span
          key={index}
          className={`${sizeClasses[size]} ${
            fillAmount >= 1 ? yellowTone : 'text-gray-200'
          }`}
        >
          ★
        </span>
      )
    }

    // Partial fill (0 < fillAmount < 1) - overlay technique
    return (
      <span
        key={index}
        className={`relative inline-block ${sizeClasses[size]}`}
      >
        <span className="text-gray-200">★</span>
        <span
          className={`absolute top-0 left-0 overflow-hidden ${yellowTone}`}
          style={{ width: `${fillAmount * 100}%` }}
        >
          ★
        </span>
      </span>
    )
  }

  return (
    <div className="flex">
      {[...Array(5)].map((_, index) => renderStar(index))}
    </div>
  )
}
