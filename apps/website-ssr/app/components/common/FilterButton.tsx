import { SlidersHorizontal } from 'lucide-react'

interface FilterButtonProps {
  onClick: () => void
  activeCount?: number
}

export function FilterButton({ onClick, activeCount = 0 }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border font-medium transition-colors flex items-center gap-2 ${
        activeCount > 0
          ? 'bg-blue-50 border-blue-200 text-primaryBlue'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      <SlidersHorizontal className="w-5 h-5" />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-primaryBlue text-white rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  )
}
