import { EditableField, EditableSelect } from '@components'
import { useAuth } from '@hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateAdminUser,
  type AdminUserDetail,
  type AdminUserRole,
  type AdminUserUpdateData
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip
} from '@uni-feedback/ui'
import { getReferralUrl, initCap } from '@uni-feedback/utils'
import { Check, Copy, MessageSquare, Shield } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getWebsiteUrl } from '../../utils'

interface UserInfoCardProps {
  user: AdminUserDetail
}

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' }
]

export function UserInfoCard({ user }: UserInfoCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user: viewer } = useAuth()
  const viewerIsSuperuser = viewer?.role === 'super_admin'
  const isSelf = viewer?.id === user.id
  const [copiedReferral, setCopiedReferral] = useState(false)

  // Same link and copy mechanics as the website's profile share buttons,
  // pointed at the student-facing site rather than the dashboard origin.
  const copyReferralLink = async () => {
    if (!user.referralCode) return
    const url = getReferralUrl(getWebsiteUrl(), user.referralCode)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedReferral(true)
      toast.success('Referral link copied')
      setTimeout(() => setCopiedReferral(false), 2000)
    } catch {
      toast.error('Could not copy the referral link')
    }
  }

  const updateMutation = useMutation({
    mutationFn: (updates: AdminUserUpdateData) =>
      updateAdminUser(user.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-details', user.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Feedback pages render the account's current email, so refresh them too
      queryClient.invalidateQueries({ queryKey: ['feedback-details'] })
      toast.success('User updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update user'
      )
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          User Information
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/feedback?user_id=${user.id}`)}
              disabled={user.feedbackCount === 0}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open in Feedback list
            </Button>
            <Badge variant="outline">#{user.id}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Account fields: the editable ones, side by side on wide screens */}
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          <EditableField
            label="Username"
            value={user.username}
            onSave={(value) => {
              const username = value.trim()
              if (!username) {
                toast.error('Username cannot be empty')
                return
              }
              if (username !== user.username) {
                updateMutation.mutate({ username })
              }
            }}
            disabled={updateMutation.isPending}
          />

          <EditableField
            label="Email"
            value={user.email}
            type="email"
            onSave={(value) => {
              const email = value.trim().toLowerCase()
              if (!email) {
                toast.error('Email cannot be empty')
                return
              }
              if (email !== user.email) {
                updateMutation.mutate({ email })
              }
            }}
            disabled={updateMutation.isPending}
          />

          <EditableField
            label="Instagram"
            value={user.instagramHandle ?? ''}
            onSave={(value) => {
              const handle = value.trim().replace(/^@/, '')
              if (handle !== (user.instagramHandle ?? '')) {
                updateMutation.mutate({ instagramHandle: handle || null })
              }
            }}
            disabled={updateMutation.isPending}
          />

          {viewerIsSuperuser && !isSelf ? (
            <EditableSelect
              label="Role"
              value={user.role}
              options={ROLE_OPTIONS}
              onSave={(value) => {
                if (value !== user.role) {
                  updateMutation.mutate({ role: value as AdminUserRole })
                }
              }}
              disabled={updateMutation.isPending}
            />
          ) : (
            <div className="space-y-2">
              <dt className="font-medium text-sm">Role</dt>
              <dd>
                {user.role === 'super_admin' ? (
                  <Badge
                    variant="secondary"
                    className="bg-amber-50 text-amber-700"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                ) : (
                  <Badge variant="outline">{initCap(user.role)}</Badge>
                )}
              </dd>
            </div>
          )}
        </div>

        {/* Read-only facts */}
        <div className="grid gap-x-8 gap-y-4 border-t pt-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <dt className="font-medium text-sm">Referral</dt>
            <dd className="flex items-center gap-2 flex-wrap text-sm">
              {user.referralCode ? (
                <>
                  <Chip label={user.referralCode} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={copyReferralLink}
                    title={getReferralUrl(getWebsiteUrl(), user.referralCode)}
                    aria-label="Copy referral link"
                  >
                    {copiedReferral ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1 text-xs">
                      {copiedReferral ? 'Copied' : 'Copy link'}
                    </span>
                  </Button>
                </>
              ) : (
                <span className="text-muted-foreground">No referral code</span>
              )}
              {user.referredByUserId !== null && (
                <span className="text-muted-foreground">
                  referred by{' '}
                  <button
                    type="button"
                    className="underline hover:text-foreground"
                    onClick={() => navigate(`/users/${user.referredByUserId}`)}
                  >
                    {user.referredByEmail ?? `user #${user.referredByUserId}`}
                  </button>
                </span>
              )}
            </dd>
          </div>

          <div className="space-y-2">
            <dt className="font-medium text-sm">Feedback</dt>
            <dd className="text-sm">
              {user.feedbackCount} submitted
              <span className="text-muted-foreground">
                {' '}
                · {user.approvedFeedbackCount} approved
              </span>
            </dd>
          </div>

          <div className="space-y-2">
            <dt className="font-medium text-sm">AI Chats</dt>
            <dd className="text-sm">
              {user.chatCount} {user.chatCount === 1 ? 'chat' : 'chats'}
            </dd>
          </div>

          <div className="space-y-2">
            <dt className="font-medium text-sm">Joined</dt>
            <dd className="text-sm text-muted-foreground">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : 'Unknown'}
            </dd>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
