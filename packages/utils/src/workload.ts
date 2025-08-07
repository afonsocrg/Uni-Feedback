/**
 * Workload rating utilities for consistent labeling across the application
 */

export function getWorkloadLabel(rating: number): string {
  const labels = ['Very heavy', 'Heavy', 'Moderate', 'Light', 'Very light']
  return labels[rating - 1] || 'Unknown'
}

export function getWorkloadColor(rating: number): string {
  const colors = [
    'bg-red-100 text-red-800 border-red-200', // 1 - Very heavy workload
    'bg-orange-100 text-orange-800 border-orange-200', // 2 - Heavy workload
    'bg-yellow-100 text-yellow-800 border-yellow-200', // 3 - Moderate workload
    'bg-lime-100 text-lime-800 border-lime-200', // 4 - Light workload
    'bg-green-100 text-green-800 border-green-200' // 5 - Very light workload
  ]
  return colors[rating - 1] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get the full workload labels used in the form (for StarRatingWithLabel)
 */
export function getWorkloadFormLabels(): string[] {
  return ['Very heavy', 'Heavy', 'Moderate', 'Light', 'Very light']
}

/**
 * Get the detailed workload labels used in WorkloadRating component
 */
export function getWorkloadDetailedLabels(): string[] {
  return [
    'Overwhelming! Consumed way too much time',
    'Very heavy workload', 
    'Moderate workload',
    'Light workload',
    'Perfect balance with my other commitments'
  ]
}