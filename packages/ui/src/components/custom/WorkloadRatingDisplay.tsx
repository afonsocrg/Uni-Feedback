import { getWorkloadLabel } from '@uni-feedback/utils'
import { Badge } from '../shadcn/badge'

function getWorkloadColor(rating: number): string {
  const colors = [
    'bg-tint-red text-tint-red-fg border-tint-red-border', // 1 - Very heavy workload
    'bg-tint-orange text-tint-orange-fg border-tint-orange-border', // 2 - Heavy workload
    'bg-tint-yellow text-tint-yellow-fg border-tint-yellow-border', // 3 - Moderate workload
    'bg-tint-lime text-tint-lime-fg border-tint-lime-border', // 4 - Light workload
    'bg-tint-green text-tint-green-fg border-tint-green-border' // 5 - Very light workload
  ]
  return (
    colors[rating - 1] ||
    'bg-tint-gray text-tint-gray-fg border-tint-gray-border'
  )
}

interface WorkloadRatingDisplayProps {
  rating: number
  className?: string
  showRating?: boolean
  muted?: boolean
  label?: string
}
export function WorkloadRatingDisplay({
  rating,
  className = '',
  showRating = false,
  muted = false,
  label
}: WorkloadRatingDisplayProps) {
  const roundedRating = Math.round(rating)
  const colorClass = muted
    ? 'bg-muted text-muted-foreground border-border'
    : getWorkloadColor(roundedRating)

  return (
    <Badge
      variant="secondary"
      className={`${colorClass} hover:${colorClass} ${className}`}
    >
      {showRating && `${rating.toFixed(1)}/5 `}
      {label ?? getWorkloadLabel(roundedRating)}
    </Badge>
  )
}
