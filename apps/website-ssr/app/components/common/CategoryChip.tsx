import { Badge } from '@uni-feedback/ui'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '~/utils'

interface CategoryChipProps extends React.AriaAttributes {
  label: string
  isActive: boolean
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function CategoryChip({
  label,
  isActive,
  className
}: CategoryChipProps) {
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
        'text-xs px-1.5 py-0.5 rounded-sm border transition-colors duration-200',
        isActive
          ? 'border-success/40 bg-success/10 text-success font-semibold'
          : 'border-border bg-background text-muted-foreground',
        className
      )}
      style={animation ? { animation } : undefined}
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
