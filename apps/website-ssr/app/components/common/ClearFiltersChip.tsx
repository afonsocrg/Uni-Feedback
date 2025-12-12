import { Chip } from '@uni-feedback/ui'
import { X } from 'lucide-react'

interface ClearFiltersChipProps {
  onClick: () => void
  visible: boolean
}

export function ClearFiltersChip({ onClick, visible }: ClearFiltersChipProps) {
  if (!visible) return null

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border cursor-pointer transition-colors hover:bg-gray-200"
      style={{
        backgroundColor: '#F3F4F6',
        color: '#6B7280',
        borderColor: '#F3F4F6'
      }}
    >
      <X className="w-3 h-3" />
      <span>Clear filters</span>
    </button>
  )
}
