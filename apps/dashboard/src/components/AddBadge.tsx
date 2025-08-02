import { Badge } from '@uni-feedback/ui'
import { Plus } from 'lucide-react'

interface AddBadgeProps {
  label: string
  onClick: () => void
}

export function AddBadge({ label, onClick }: AddBadgeProps) {
  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
      onClick={onClick}
    >
      <Plus className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}