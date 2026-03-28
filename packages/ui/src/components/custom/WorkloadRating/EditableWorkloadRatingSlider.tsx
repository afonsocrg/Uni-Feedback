import { getWorkloadLabel } from '@uni-feedback/utils'
import { useState } from 'react'
import { cn } from '../../../utils/cn'

export interface EditableWorkloadRatingSliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  showLabel?: boolean
}

export function EditableWorkloadRatingSlider({
  value,
  onChange,
  disabled = false,
  showLabel = true
}: EditableWorkloadRatingSliderProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0

  // Convert rating (1-5) to slider position (0-100)
  // Rating 5 (Very light) = position 0 (left)
  // Rating 1 (Very heavy) = position 100 (right)
  const ratingToPosition = (rating: number) => {
    return rating === 0 ? 50 : (6 - rating) * 25 - 25
  }

  // Convert slider position (0-100) to rating (1-5)
  const positionToRating = (position: number) => {
    return 6 - Math.round(position / 25 + 1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = Number(e.target.value)
    const rating = positionToRating(position)
    onChange(rating)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (disabled) return
    const input = e.currentTarget
    const rect = input.getBoundingClientRect()
    const position = ((e.clientX - rect.left) / rect.width) * 100
    const rating = positionToRating(Math.max(0, Math.min(100, position)))
    setHoverValue(rating)
  }

  const currentPosition = ratingToPosition(value)
  const fillPercentage = value > 0 ? currentPosition : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Slider container */}
        <div className="relative flex-1 min-w-[200px] py-2">
          {/* Track background */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 rounded-full pointer-events-none" />

          {/* Filled track */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-primaryBlue rounded-full pointer-events-none transition-all"
            style={{ width: `${fillPercentage}%` }}
          />

          {/* Tick marks */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full pointer-events-none">
            {[0, 25, 50, 75, 100].map((position) => (
              <div
                key={position}
                className="absolute w-0.5 h-2.5 bg-gray-400 rounded-full -translate-x-1/2"
                style={{ left: `${position}%` }}
              />
            ))}
          </div>

          {/* Range input */}
          <input
            type="range"
            min="0"
            max="100"
            step="25"
            value={currentPosition}
            onChange={handleChange}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverValue(null)}
            disabled={disabled}
            className={cn(
              'relative w-full bg-transparent appearance-none cursor-pointer z-10',
              'focus:outline-none',
              disabled && 'cursor-not-allowed opacity-50',
              // Thumb styling - centered on track
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-5',
              '[&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-white',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-primaryBlue',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-shadow',
              '[&::-webkit-slider-thumb]:hover:shadow-lg',
              '[&::-webkit-slider-thumb]:focus:ring-2',
              '[&::-webkit-slider-thumb]:focus:ring-primaryBlue',
              '[&::-webkit-slider-thumb]:focus:ring-offset-2',
              '[&::-webkit-slider-thumb]:-mt-[7px]',
              // Firefox thumb styling - centered on track
              '[&::-moz-range-thumb]:w-5',
              '[&::-moz-range-thumb]:h-5',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-white',
              '[&::-moz-range-thumb]:border-2',
              '[&::-moz-range-thumb]:border-primaryBlue',
              '[&::-moz-range-thumb]:shadow-md',
              '[&::-moz-range-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:transition-shadow',
              '[&::-moz-range-thumb]:hover:shadow-lg',
              '[&::-moz-range-thumb]:focus:ring-2',
              '[&::-moz-range-thumb]:focus:ring-primaryBlue',
              '[&::-moz-range-thumb]:focus:ring-offset-2'
            )}
            style={{
              height: '20px'
            }}
            aria-label="Workload rating slider"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={value}
            aria-valuetext={getWorkloadLabel(value)}
          />
        </div>

        {/* Current selection label */}
        {showLabel && displayValue > 0 && (
          <div className="text-sm text-gray-700 min-w-[90px]">
            {getWorkloadLabel(displayValue)}
          </div>
        )}
      </div>

      {/* End labels */}
      <div className="flex justify-between text-xs text-gray-500 px-0.5">
        <span>Very light</span>
        <span>Very heavy</span>
      </div>
    </div>
  )
}
