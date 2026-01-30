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
  bg: '#FFFFFF', // gray-100
  text: '#6B7280', // gray-500
  // border: '#E5E7EB' // gray-200
  border: 'transparent' // gray-200
}

// Active state - primaryBlue like sort chips in FilterChip
const ACTIVE_COLORS = {
  bg: '#FFFFFF', // primaryBlue
  text: '#23729f', // White
  // border: '#23729f' // primaryBlue
  border: 'transparent' // primaryBlue
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
        'text-xs px-2 py-0.5',
        isActive && 'font-medium font-bold',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border
      }}
    >
      {Icon && <Icon className="size-3.5" />}
      {label}
    </Badge>
  )
}
