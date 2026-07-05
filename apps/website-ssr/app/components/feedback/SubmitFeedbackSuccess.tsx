import { type FeedbackRecommendation } from '@uni-feedback/api-client'
import {
  Button,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { ChevronRight, HelpCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import {
  getCourseFeedbackPath,
  getCoursePath,
  getFeedbackAnchor,
  getLocalePath
} from '~/utils/i18n-routes'
import { InviteFriendCard } from './InviteFriendCard'

interface FeedbackSubmitSuccessProps {
  pointsEarned?: number
  courseId?: number
  feedbackId?: number
  recommendations: FeedbackRecommendation[]
  isLoadingRecommendations?: boolean
  onSubmitAnother: () => void
  /** The current user's referral code, used to render the invite CTA. */
  referralCode?: string | null
  /** Points the user just earned for accepting an invite (their first
   * feedback). When greater than 0, the reward shows a feedback/bonus breakdown. */
  referralBonusEarned?: number
}

export function SubmitFeedbackSuccess({
  pointsEarned,
  courseId,
  feedbackId,
  recommendations,
  isLoadingRecommendations = false,
  onSubmitAnother,
  referralCode = null,
  referralBonusEarned = 0
}: FeedbackSubmitSuccessProps) {
  const lang = useLang()
  const { t } = useTranslation('feedback')

  // Reward is one moment: total earned now = feedback points + any invite bonus.
  const feedbackPoints = pointsEarned ?? 0
  const totalPoints = feedbackPoints + referralBonusEarned
  const hasPoints = totalPoints > 0
  const hasReferralBonus = referralBonusEarned > 0

  const feedbackUrl =
    courseId && feedbackId
      ? getFeedbackAnchor(lang, courseId, feedbackId)
      : courseId
        ? getCoursePath(lang, courseId)
        : undefined

  const hasRecommendations = recommendations.length > 0

  // Anchor the post-submission funnel: the success screen was shown. Branches
  // out from here are the share buttons and the "give another" / browse links.
  useEffect(() => {
    analytics.feedback.successViewed({
      courseId,
      hasRecommendations,
      hasReferralCode: !!referralCode,
      referralBonusEarned
    })
    // Fire once per success screen (component is keyed by course, so it
    // remounts for a new submission).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-[90vh] flex items-center justify-center bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-8">
          {/* 1. Reward moment — one celebratory line + one consolidated number */}
          <div className="text-center space-y-4 pt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {t('success.title')}
            </h2>

            {hasPoints && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-5xl md:text-6xl font-bold text-primaryBlue">
                  +{totalPoints}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-medium text-muted-foreground">
                    {t('success.points', { count: totalPoints })}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={getLocalePath('points', lang)}
                          className="text-muted-foreground hover:text-muted-foreground transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('success.how_points_work')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Breakdown only when an invite bonus was folded into the total */}
                {hasReferralBonus && (
                  <p className="text-sm text-muted-foreground">
                    {t('success.points_breakdown', {
                      feedback: feedbackPoints,
                      bonus: referralBonusEarned
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. Hero — invite a friend (referral is the growth lever) */}
          <InviteFriendCard referralCode={referralCode} />

          {/* 3. Demoted (but still rich) — suggested courses to review next.
              A tap-to-review list removes the "which course next?" friction. */}
          {isLoadingRecommendations ? (
            <div className="space-y-2">
              <Skeleton className="mx-auto h-4 w-3/4" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : hasRecommendations ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">
                {t('success.recommendations_header')}
              </p>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {recommendations.map((course, index) => (
                  <div key={course.id}>
                    <a
                      href={`${getCourseFeedbackPath(lang, course.id)}?from=recommendations`}
                      onClick={() =>
                        analytics.navigation.feedbackFormLinkClicked({
                          source: 'success_recommendation',
                          referrerPage: 'feedback_success',
                          courseId: course.id
                        })
                      }
                      className="group flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-foreground">
                          {course.acronym}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {course.name}
                        </div>
                      </div>
                      <ChevronRight className="size-5 flex-shrink-0 text-muted-foreground group-hover:text-primaryBlue" />
                    </a>
                    {index < recommendations.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={onSubmitAnother}
                  className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t('success.give_another')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              🏆 {t('success.all_reviewed_title')}{' '}
              <a
                href={getLocalePath('browse', lang)}
                onClick={() =>
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'success_browse_all',
                    referrerPage: 'feedback_success'
                  })
                }
                className="text-primaryBlue hover:underline"
              >
                {t('success.browse_all')}
              </a>
            </div>
          )}

          {/* 4. Utility — view your feedback */}
          {feedbackUrl && (
            <div className="text-center pt-4">
              <a
                href={feedbackUrl}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('success.view_feedback')}
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
