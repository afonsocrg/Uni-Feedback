import { Badge } from '@uni-feedback/ui'
import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '~/utils'

interface CategoryChipProps {
  label: string
  isActive: boolean
  icon?: LucideIcon
  className?: string
}

// Muted state for inactive categories
const MUTED_COLORS = {
  bg: '#F0F4F8', // Very soft blue-gray
  text: '#64748B' // slate-500
}

// Active state - solid color with checkmark
const ACTIVE_COLORS = {
  bg: '#23729f', // primaryBlue text
  text: '#EBF5FB' // light blue background
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
        'text-xs px-2 py-0.5 rounded-sm border-0',
        isActive && 'font-medium',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text
      }}
    >
      <span className="flex items-center gap-1">
        {label}
        {isActive && <Check className="size-3" />}
      </span>
    </Badge>
  )
}
