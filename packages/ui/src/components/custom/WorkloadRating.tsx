import { getWorkloadDetailedLabels } from '@uni-feedback/utils'

interface WorkloadRatingProps {
  rating: number
  onChange: (rating: number) => void
}

export function WorkloadRating({ rating, onChange }: WorkloadRatingProps) {
  const labels = getWorkloadDetailedLabels()

  return (
    <div className="space-y-2">
      {labels.map((label, index) => (
        <label
          key={index}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="radio"
            name="workload"
            value={index + 1}
            checked={rating === index + 1}
            onChange={() => onChange(index + 1)}
            className="h-4 w-4 text-primaryBlue focus:ring-primaryBlue border-gray-300"
          />
          <span className="text-gray-700">{label}</span>
        </label>
      ))}
    </div>
  )
}
