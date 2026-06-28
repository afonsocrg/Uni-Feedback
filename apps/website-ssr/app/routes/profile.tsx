import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  deleteAccount,
  deleteInstagramHandle,
  setInstagramHandle
} from '@uni-feedback/api-client'
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
import { normalizeInstagramHandle } from '@uni-feedback/utils'
import {
  AlertTriangle,
  Check,
  Copy,
  HelpCircle,
  Loader2,
  User
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SiInstagram } from 'react-icons/si'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  GenericBreadcrumb,
  ProfileFeedbackCard,
  ProfilePageSkeleton
} from '~/components'
import { useLang, useRequiredAuth } from '~/hooks'
import {
  useProfile,
  useProfileFeedback,
  useProfileStats
} from '~/hooks/queries'
import { analytics, getPageName } from '~/utils/analytics'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'

export function meta() {
  return [
    { title: 'Profile - Uni Feedback' },
    {
      name: 'description',
      content: 'Manage your Uni Feedback account and preferences.'
    }
  ]
}

type DeleteAccountFormData = {
  emailConfirmation: string
}

export default function ProfilePage() {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const { user, logout } = useRequiredAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)

  const { data: statsData, isLoading: isStatsLoading } = useProfileStats()
  const { data: feedbackData, isLoading: isFeedbackLoading } =
    useProfileFeedback()
  const { data: profileData } = useProfile()

  const instagramHandle = profileData?.user.instagramHandle ?? null
  const [isEditingInstagram, setIsEditingInstagram] = useState(false)
  const [instagramInput, setInstagramInput] = useState('')
  const [isSavingInstagram, setIsSavingInstagram] = useState(false)

  const deleteAccountSchema = z.object({
    emailConfirmation: z.string().email(t('profile.delete_email_invalid'))
  })

  const form = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      emailConfirmation: ''
    }
  })

  const stats = statsData?.stats

  // Show skeleton on initial load
  const isInitialLoading = isStatsLoading || isFeedbackLoading

  const handleShareReferralLink = async () => {
    if (!user.referralCode) return

    const referralUrl = `${window.location.origin}/login?ref=${user.referralCode}`

    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopiedReferral(true)
      toast.success(t('profile.toast_referral_copied'))
      setTimeout(() => setCopiedReferral(false), 2000)
    } catch {
      toast.error(t('profile.toast_referral_failed'))
    }
  }

  const startEditingInstagram = () => {
    setInstagramInput(instagramHandle ?? '')
    setIsEditingInstagram(true)
  }

  const refreshProfileAndStats = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })
    ])

  const handleSaveInstagram = async () => {
    const normalized = normalizeInstagramHandle(instagramInput)
    if (!normalized) {
      toast.error(t('profile.instagram_invalid'))
      return
    }

    setIsSavingInstagram(true)
    try {
      const wasLinked = instagramHandle !== null
      await setInstagramHandle(normalized)
      await refreshProfileAndStats()
      setIsEditingInstagram(false)
      toast.success(
        wasLinked
          ? t('profile.toast_instagram_updated')
          : t('profile.toast_instagram_linked')
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_instagram_failed')
      )
    } finally {
      setIsSavingInstagram(false)
    }
  }

  const handleRemoveInstagram = async () => {
    setIsSavingInstagram(true)
    try {
      await deleteInstagramHandle()
      await refreshProfileAndStats()
      setIsEditingInstagram(false)
      toast.success(t('profile.toast_instagram_removed'))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_instagram_failed')
      )
    } finally {
      setIsSavingInstagram(false)
    }
  }

  const handleDeleteAccount = async (values: DeleteAccountFormData) => {
    if (values.emailConfirmation !== user.email) {
      form.setError('emailConfirmation', {
        type: 'manual',
        message: t('profile.delete_email_mismatch')
      })
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount()
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER)
      setShowDeleteDialog(false)
      toast.success(t('profile.toast_deleted'))
      navigate(getLocalePath('home', lang))
      await logout()
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : t('profile.toast_delete_failed')
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (isInitialLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="min-h-full bg-gray-50/30">
      <div className="container mx-auto px-4 pt-6">
        <GenericBreadcrumb
          items={[{ label: t('profile.page_title'), isActive: true }]}
        />
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
                <p
                  className="truncate text-sm font-medium text-gray-700"
                  title={user.email}
                >
                  {user.email}
                </p>
                {isStatsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {t('profile.loading_stats')}
                  </p>
                ) : stats ? (
                  <p className="text-2xl font-bold text-primaryBlue flex items-center gap-1">
                    {stats.totalPoints}{' '}
                    <span className="text-sm text-muted-foreground font-normal">
                      {t('profile.points')}
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="cursor-pointer"
                          aria-label={t('profile.how_points_work')}
                        >
                          <HelpCircle className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 text-sm">
                        <p className="font-medium mb-2">
                          {t('profile.how_points_work')}
                        </p>
                        <p className="text-muted-foreground mb-3">
                          {t('profile.points_desc')}
                        </p>
                        <Link
                          to={getLocalePath('points', lang)}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          {t('profile.learn_more')}
                        </Link>
                      </PopoverContent>
                    </Popover>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('profile.stats_failed')}
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
                    {t('profile.feedback_count', {
                      count: stats.feedbackCount
                    })}
                  </span>
                  <span className="font-medium">
                    {stats.feedbackPoints} {t('profile.pts')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('profile.referral_count', {
                      count: stats.referralCount
                    })}
                  </span>
                  <span className="font-medium">
                    {stats.referralPoints} {t('profile.pts')}
                  </span>
                </div>
                {stats.bonusPoints > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('profile.bonus_points')}
                    </span>
                    <span className="font-medium">
                      {stats.bonusPoints} {t('profile.pts')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Referral Section */}
          <div className="space-y-5">
            {user.referralCode && (
              <div>
                <p className="text-sm font-semibold mb-1">
                  {t('profile.referral_title')}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('profile.referral_desc')}
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
                    title={t('profile.copy_referral')}
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

            {/* Instagram Section */}
            <div>
              <p className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <SiInstagram className="size-4" />
                {t('profile.instagram_title')}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {t('profile.instagram_desc')}
              </p>

              {instagramHandle && !isEditingInstagram ? (
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium truncate">
                    @{instagramHandle}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingInstagram}
                    disabled={isSavingInstagram}
                  >
                    {t('profile.instagram_edit_btn')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveInstagram}
                    disabled={isSavingInstagram}
                  >
                    {isSavingInstagram ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t('profile.instagram_remove_btn')
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={instagramInput}
                    onChange={(e) => setInstagramInput(e.target.value)}
                    placeholder={t('profile.instagram_placeholder')}
                    className="text-sm bg-white"
                    disabled={isSavingInstagram}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveInstagram()
                    }}
                  />
                  <Button
                    onClick={handleSaveInstagram}
                    disabled={isSavingInstagram || instagramInput.trim() === ''}
                  >
                    {isSavingInstagram ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      t('profile.instagram_link_btn')
                    )}
                  </Button>
                  {isEditingInstagram && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingInstagram(false)}
                      disabled={isSavingInstagram}
                    >
                      {t('profile.instagram_cancel_btn')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Your Feedback Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t('profile.my_feedback_title')}
            </h2>
            <Link
              to={`${getReviewPath(lang)}?from=profile`}
              onClick={() => {
                analytics.navigation.feedbackFormLinkClicked({
                  source: 'profile_page',
                  referrerPage: getPageName(window.location.pathname)
                })
              }}
            >
              <Button>{t('profile.my_feedback_cta')}</Button>
            </Link>
          </div>
          {isFeedbackLoading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {t('profile.loading_feedback')}
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
                {t('profile.my_feedback_empty')}
              </p>
              <Link to={getLocalePath('browse', lang)}>
                <Button variant="outline">
                  {t('profile.my_feedback_browse')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-8 border-t">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1">
                {t('profile.delete_account_btn')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('profile.delete_account_desc')}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="sm:flex-shrink-0"
            >
              {t('profile.delete_account_btn')}
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
                {t('profile.delete_dialog_title')}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t('profile.delete_dialog_desc')}
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
                          {t('profile.delete_confirm_label', {
                            email: user.email
                          })}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('profile.delete_confirm_placeholder')}
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
                    {t('profile.delete_cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={
                      isDeleting ||
                      form.watch('emailConfirmation') !== user.email
                    }
                  >
                    {isDeleting
                      ? t('profile.delete_deleting')
                      : t('profile.delete_confirm_btn')}
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
