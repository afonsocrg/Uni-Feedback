import { Chip } from '@uni-feedback/ui'

interface ClearFiltersChipProps {
  onClick: () => void
  visible: boolean
}

export function ClearFiltersChip({ onClick, visible }: ClearFiltersChipProps) {
  if (!visible) return null

  return (
    <Chip
      label="Clear filters"
      color="red"
      size="sm"
      onClick={onClick}
      className="cursor-pointer"
    />
  )
}
