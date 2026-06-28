import { Popover, PopoverContent, PopoverTrigger } from '@uni-feedback/ui'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '~/utils'

interface InfoPopoverProps {
  content: ReactNode
  /** Accessible label for the trigger (e.g. screen readers). */
  label?: string
  className?: string
}

export function InfoPopover({ content, label, className }: InfoPopoverProps) {
  return (
    <Popover>
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
