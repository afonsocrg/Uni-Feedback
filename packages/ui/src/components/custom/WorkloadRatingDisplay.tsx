import { getWorkloadLabel } from '@uni-feedback/utils'
import { Badge } from '../shadcn/badge'

function getWorkloadColor(rating: number): string {
  const colors = [
    'bg-red-100 text-red-800 border-red-200', // 1 - Very heavy workload
    'bg-orange-100 text-orange-800 border-orange-200', // 2 - Heavy workload
    'bg-yellow-100 text-yellow-800 border-yellow-200', // 3 - Moderate workload
    'bg-lime-100 text-lime-800 border-lime-200', // 4 - Light workload
    'bg-green-100 text-green-800 border-green-200' // 5 - Very light workload
  ]
  return colors[rating - 1] || 'bg-gray-100 text-gray-800 border-gray-200'
}

interface WorkloadRatingDisplayProps {
  rating: number
  className?: string
}
export function WorkloadRatingDisplay({
  rating,
  className = ''
}: WorkloadRatingDisplayProps) {
  return (
    <Badge
      variant="secondary"
      className={`${getWorkloadColor(rating)} hover:${getWorkloadColor(rating)} ${className}`}
    >
      {rating}/5 {getWorkloadLabel(rating)}
    </Badge>
  )
}
