import { Badge } from '../shadcn/badge'

const APPROVAL_COLORS = {
  approved: { bg: '#E8F5E9', text: '#2E7D32' }, // Light green background, dark green text
  unapproved: { bg: '#FFEBEE', text: '#C62828' } // Light red background, dark red text
}

interface ApprovalStatusBadgeProps {
  approved: boolean
  className?: string
}

export function ApprovalStatusBadge({
  approved,
  className = ''
}: ApprovalStatusBadgeProps) {
  const colors = APPROVAL_COLORS[approved ? 'approved' : 'unapproved']

  return (
    <Badge
      variant="outline"
      className={`text-xs ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.bg
      }}
    >
      {approved ? 'Approved' : 'Unapproved'}
    </Badge>
  )
}