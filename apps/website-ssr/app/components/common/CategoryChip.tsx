import { Badge } from '@uni-feedback/ui'
import type { LucideIcon } from 'lucide-react'
import { cn } from '~/utils'

interface CategoryChipProps {
  label: string
  isActive: boolean
  icon?: LucideIcon
  className?: string
}

// Muted state for inactive categories
const MUTED_COLORS = {
  bg: '#F9FAFB', // gray-50 - light background
  text: '#6B7280', // gray-500
  border: '#E5E7EB' // gray-200 - visible border
}

// Active state - primaryBlue
const ACTIVE_COLORS = {
  bg: '#EBF5FB', // light blue background
  text: '#23729f', // primaryBlue text
  border: '#23729f' // primaryBlue border
}

export function CategoryChip({
  label,
  isActive,
  icon: Icon,
  className
}: CategoryChipProps) {
  const colors = isActive ? ACTIVE_COLORS : MUTED_COLORS

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs px-2 py-0.5 rounded rounded-sm border',
        isActive && 'font-semibold',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
    >
      {label}
    </Badge>
  )
}
