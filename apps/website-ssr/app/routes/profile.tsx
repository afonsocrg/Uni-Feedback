import { zodResolver } from '@hookform/resolvers/zod'
import { deleteAccount } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@uni-feedback/ui'
import { AlertTriangle, Check, Copy, HelpCircle, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { GenericBreadcrumb, ProfileFeedbackCard } from '~/components'
import { useRequiredAuth } from '~/hooks'
import { useProfileFeedback, useProfileStats } from '~/hooks/queries'
import { STORAGE_KEYS } from '~/utils/constants'

export function meta() {
  return [
    { title: 'Profile - Uni Feedback' },
    {
      name: 'description',
      content: 'Manage your Uni Feedback account and preferences.'
    }
  ]
}

const deleteAccountSchema = z.object({
  emailConfirmation: z.string().email('Please enter a valid email address')
})

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>

export default function ProfilePage() {
  const { user, logout } = useRequiredAuth()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)

  // Fetch user stats and feedback
  const { data: statsData, isLoading: isStatsLoading } = useProfileStats()
  const { data: feedbackData, isLoading: isFeedbackLoading } =
    useProfileFeedback()

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      emailConfirmation: ''
    }
  })

  const stats = statsData?.stats

  const handleShareReferralLink = async () => {
    if (!user.referralCode) return

    const referralUrl = `${window.location.origin}/login?ref=${user.referralCode}`

    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopiedReferral(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopiedReferral(false), 2000)
    } catch (error) {
      toast.error('Failed to copy referral link')
    }
  }

  const handleDeleteAccount = async (values: DeleteAccountFormData) => {
    if (values.emailConfirmation !== user.email) {
      form.setError('emailConfirmation', {
        type: 'manual',
        message: 'Email does not match your account email'
      })
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount()
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
      setShowDeleteDialog(false)
      toast.success('Your account has been deleted successfully')
      navigate('/')
      await logout()
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete account. Please try again.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-50/30">
      <div className="container mx-auto px-4 pt-6">
        <GenericBreadcrumb items={[{ label: 'Profile', isActive: true }]} />
      </div>
      <div className="mx-auto px-4 py-8 max-w-4xl">
        {/* Top Section: User Info + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left: User Info & Stats */}
          <div className="space-y-6">
            {/* User Avatar & Email with Total Points */}
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="size-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="break-all text-sm font-medium text-gray-700">
                  {user.email}
                </p>
                {isStatsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading stats...
                  </p>
                ) : stats ? (
                  <p className="text-2xl font-bold text-primaryBlue flex items-center gap-1">
                    {stats.totalPoints}{' '}
                    <span className="text-sm text-muted-foreground font-normal">
                      points
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="cursor-pointer"
                          aria-label="How do points work?"
                        >
                          <HelpCircle className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 text-sm">
                        <p className="font-medium mb-2">How do points work?</p>
                        <p className="text-muted-foreground mb-3">
                          Earn points by submitting feedback and referring
                          friends. Points unlock rewards and recognition!
                        </p>
                        <Link
                          to="/points"
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          Learn more &rarr;
                        </Link>
                      </PopoverContent>
                    </Popover>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Failed to load stats
                  </p>
                )}
              </div>
            </div>

            {/* Point Breakdown */}
            {stats && (
              <div className="space-y-2 text-sm">
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {stats.feedbackCount} Feedback
                    {stats.feedbackCount !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">
                    {stats.feedbackPoints} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {stats.referralCount} Referral
                    {stats.referralCount !== 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">
                    {stats.referralPoints} pts
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Referral Section */}
          <div className="space-y-3">
            {user.referralCode && (
              <div>
                <p className="text-sm font-semibold mb-1">
                  Invite your friends!
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Earn points for every friend who posts their first feedback
                </p>
                <div className="relative">
                  <Input
                    value={`${window.location.origin}/login?ref=${user.referralCode}`}
                    readOnly
                    className="pr-10 text-sm bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShareReferralLink}
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
                    title="Copy referral link"
                  >
                    {copiedReferral ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Your Feedback Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Feedback</h2>
            <Link to="/feedback/new">
              <Button>Give Feedback!</Button>
            </Link>
          </div>
          {isFeedbackLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Loading feedback...
              </p>
            </div>
          ) : feedbackData && feedbackData.feedback?.length > 0 ? (
            <div className="space-y-4">
              {feedbackData.feedback.map((feedback) => (
                <ProfileFeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">
                You haven't submitted any feedback yet.
              </p>
              <Link to="/browse">
                <Button variant="outline">Browse Courses</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and anonymize your data. Your
                feedback will be preserved anonymously to help other students.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="sm:flex-shrink-0"
            >
              Delete Account
            </Button>
          </div>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent
            className="sm:max-w-md"
            onInteractOutside={(e) => {
              if (isDeleting) e.preventDefault()
            }}
            onEscapeKeyDown={(e) => {
              if (isDeleting) e.preventDefault()
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-sm">
                This action cannot be undone. Your personal information will be
                permanently deleted, but your feedback will remain anonymous to
                help other students.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleDeleteAccount)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="emailConfirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        <span className="text-center">
                          Type {user.email} to confirm
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="text-sm"
                          {...field}
                          disabled={isDeleting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={
                      isDeleting ||
                      form.watch('emailConfirmation') !== user.email
                    }
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
