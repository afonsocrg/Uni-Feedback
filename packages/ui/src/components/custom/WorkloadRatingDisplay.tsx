import { Badge } from '../shadcn/badge'

interface WorkloadRatingDisplayProps {
  rating: number
  className?: string
}

export function WorkloadRatingDisplay({ 
  rating, 
  className = '' 
}: WorkloadRatingDisplayProps) {
  const getWorkloadLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'Overwhelming'
      case 2:
        return 'Very heavy'
      case 3:
        return 'Moderate'
      case 4:
        return 'Light'
      case 5:
        return 'Perfect balance'
      default:
        return 'Unknown'
    }
  }

  const getWorkloadBadgeClasses = (rating: number): string => {
    switch (rating) {
      case 1:
        return 'bg-red-100 text-red-800 hover:bg-red-100'
      case 2:
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
      case 3:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      case 4:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 5:
        return 'bg-green-100 text-green-800 hover:bg-green-100'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    }
  }

  return (
    <Badge 
      variant="secondary"
      className={`${getWorkloadBadgeClasses(rating)} ${className}`}
    >
      {rating}/5 {getWorkloadLabel(rating)}
    </Badge>
  )
}