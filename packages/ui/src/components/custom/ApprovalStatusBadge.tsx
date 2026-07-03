import { Badge } from '../shadcn/badge'

const APPROVAL_COLORS = {
  approved: 'bg-tint-green text-tint-green-fg border-tint-green-border',
  unapproved: 'bg-tint-red text-tint-red-fg border-tint-red-border'
}

interface ApprovalStatusBadgeProps {
  approved: boolean
  className?: string
}

export function ApprovalStatusBadge({
  approved,
  className = ''
}: ApprovalStatusBadgeProps) {
  const colorClass = APPROVAL_COLORS[approved ? 'approved' : 'unapproved']

  return (
    <Badge variant="outline" className={`text-xs ${colorClass} ${className}`}>
      {approved ? 'Approved' : 'Unapproved'}
    </Badge>
  )
}
