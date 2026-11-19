import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/utils'

interface InfoPopoverProps {
  content: ReactNode
  /** Accessible label for the trigger (e.g. screen readers). */
  label?: string
  className?: string
  /** Opened or closed, e.g. to track that the explanation was read */
  onOpenChange?: (open: boolean) => void
}

export function InfoPopover({
  content,
  label,
  className,
  onOpenChange
}: InfoPopoverProps) {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger
        className={cn(
          'text-muted-foreground transition-colors hover:text-foreground',
          className
        )}
        aria-label={label}
      >
        <Info className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm text-muted-foreground">
        {content}
      </PopoverContent>
    </Popover>
  )
}
