import { useQuery } from '@tanstack/react-query'
import { getAdminUserReferrals } from '@uni-feedback/api-client'
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { useNavigate } from 'react-router'

interface UserReferralsTabContentProps {
  userId: number
}

/**
 * Accounts that signed up through this user's referral link. A referral only
 * pays out after the new account submits feedback, so the feedback column is
 * what tells a "real" referral from a sign-up that went nowhere.
 */
export function UserReferralsTabContent({
  userId
}: UserReferralsTabContentProps) {
  const navigate = useNavigate()

  const {
    data: referrals,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-referrals', userId],
    queryFn: () => getAdminUserReferrals(userId)
  })

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load referrals</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    )
  }

  if (isLoading || !referrals) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading referrals...</p>
      </div>
    )
  }

  if (referrals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nobody has signed up through this user's referral link yet
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-32">Joined</TableHead>
            <TableHead className="w-40">Feedback</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referred) => (
            <TableRow
              key={referred.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/users/${referred.id}`)}
            >
              <TableCell>
                <Chip color="white" label={referred.email} />
              </TableCell>
              <TableCell className="text-sm">{referred.username}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {referred.createdAt
                  ? new Date(referred.createdAt).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell className="text-sm">
                {referred.feedbackCount === 0 ? (
                  <span className="text-muted-foreground">None yet</span>
                ) : (
                  <>
                    {referred.feedbackCount} submitted
                    <span className="text-muted-foreground">
                      {' '}
                      · {referred.approvedFeedbackCount} approved
                    </span>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
