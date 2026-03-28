import { Badge } from '@uni-feedback/ui'
import { Check, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '~/utils'

interface CategoryChipProps {
  label: string
  isActive: boolean
  icon?: LucideIcon
  className?: string
}

// Muted state for inactive categories
const MUTED_COLORS = {
  bg: '#FFFFFF', // White background
  text: '#64748B' // slate-500 muted text
}

// Active state - success green with checkmark
const ACTIVE_COLORS = {
  bg: '#FFFFFF', // White background
  text: '#10b981' // emerald-500 success green
}

export function CategoryChip({
  label,
  isActive,
  icon: Icon,
  className
}: CategoryChipProps) {
  const colors = isActive ? ACTIVE_COLORS : MUTED_COLORS
  const prevActiveRef = useRef(isActive)
  const [animation, setAnimation] = useState<string | undefined>()

  useEffect(() => {
    // Detect state change
    if (prevActiveRef.current !== isActive) {
      if (isActive) {
        // Activated: scale up
        setAnimation('scale-pulse 0.2s ease-out')
      } else {
        // Deactivated: subtle scale down
        setAnimation('scale-fade 0.2s ease-out')
      }

      // Clear animation after it completes
      const timer = setTimeout(() => setAnimation(undefined), 200)

      prevActiveRef.current = isActive
      return () => clearTimeout(timer)
    }
  }, [isActive])

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-sm border-0 transition-colors duration-200',
        isActive && 'font-semibold',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        ...(animation && { animation })
      }}
    >
      <span className="flex items-center gap-0.5">
        <Check
          className={cn(
            'size-3 transition-opacity duration-200',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
          strokeWidth={3}
        />
        {label}
      </span>
    </Badge>
  )
}
