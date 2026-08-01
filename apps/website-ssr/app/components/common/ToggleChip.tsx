import { Badge } from '@uni-feedback/ui'
import { cn } from '~/utils'

interface ToggleChipProps {
  label: string
  isActive: boolean
  onClick: () => void
}

/**
 * A single-value filter chip that toggles itself on and off.
 *
 * The counterpart to <FilterChip>, which is one chip hiding a list behind a
 * popover. Use this when the options are few and worth showing at a glance (the
 * five universities on the faculty picker); use <FilterChip> when they aren't.
 *
 * Active styling matches <FilterChip>'s so a row can mix the two without
 * looking like two different controls.
 */
export function ToggleChip({ label, isActive, onClick }: ToggleChipProps) {
  return (
    <Badge
      asChild
      variant="outline"
      className={cn(
        'cursor-pointer text-xs px-2 py-0.5 transition-colors',
        isActive
          ? 'bg-tint-blue text-tint-blue-fg border-tint-blue-border'
          : 'bg-tint-gray text-tint-gray-fg border-tint-gray-border hover:bg-muted'
      )}
    >
      <button type="button" onClick={onClick} aria-pressed={isActive}>
        {label}
      </button>
    </Badge>
  )
}
