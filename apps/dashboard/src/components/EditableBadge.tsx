import { Badge } from '@uni-feedback/ui'
import { X } from 'lucide-react'

interface EditableBadgeProps {
  value: string
  prefix?: string
  onRemove: (value: string) => void
  disabled?: boolean
  backgroundColor?: string
}

export function EditableBadge({
  value,
  prefix = '',
  onRemove,
  disabled = false,
  backgroundColor
}: EditableBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="font-mono group transition-colors has-[button:hover]:bg-destructive/10"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {prefix}{value}
      <button
        onClick={() => onRemove(value)}
        className="ml-2 cursor-pointer hover:text-destructive transition-colors"
        disabled={disabled}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}