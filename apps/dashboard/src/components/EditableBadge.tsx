import { Badge } from '@uni-feedback/ui'
import { X } from 'lucide-react'

interface EditableBadgeProps {
  value: string
  prefix?: string
  onRemove: (value: string) => void
  disabled?: boolean
}

export function EditableBadge({
  value,
  prefix = '',
  onRemove,
  disabled = false
}: EditableBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="font-mono group hover:bg-destructive/10 transition-colors"
    >
      {prefix}{value}
      <button
        onClick={() => onRemove(value)}
        className="ml-2 hover:text-destructive transition-colors"
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}