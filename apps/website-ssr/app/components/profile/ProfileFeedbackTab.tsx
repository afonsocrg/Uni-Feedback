import type {
  UserFeedback,
  UserFeedbackResponse
} from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { formatSchoolYearString, groupBy } from '@uni-feedback/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { ProfileFeedbackCard } from '../feedback/cards/ProfileFeedbackCard'

// Order school-year groups most recent first, with the `null` group (reviews
// without a school year, e.g. still pending) trailing at the end.
function sortSchoolYearGroups(
  groups: Map<number | null, UserFeedback[]>
): [number | null, UserFeedback[]][] {
  return Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return b - a
  })
}

/** "My feedback" tab: submit CTA plus the list of the user's reviews. */
export function ProfileFeedbackTab({
  feedbackData,
  isFeedbackLoading
}: {
  feedbackData: UserFeedbackResponse | undefined
  isFeedbackLoading: boolean
}) {
  const { t } = useTranslation('feedback')
  const lang = useLang()

  const groupedFeedback = useMemo(() => {
    const groups = groupBy(
      feedbackData?.feedback ?? [],
      (f) => f.schoolYear ?? null
    )
    return sortSchoolYearGroups(groups)
  }, [feedbackData])

  return (
    <>
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
      ) : groupedFeedback.length > 0 ? (
        <div className="space-y-4">
          {groupedFeedback.map(([schoolYear, yearFeedback]) => (
            <div key={schoolYear ?? 'no-school-year'} className="mb-8">
              <div className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                {schoolYear !== null
                  ? formatSchoolYearString(schoolYear, { yearFormat: 'long' })
                  : t('profile.my_feedback_pending_group')}
              </div>
              <div className="space-y-4">
                {yearFeedback.map((feedback) => (
                  <ProfileFeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.my_feedback_empty')}
          </p>
          <Link to={getLocalePath('browse', lang)}>
            <Button variant="outline">{t('profile.my_feedback_browse')}</Button>
          </Link>
        </div>
      )}
    </>
  )
}
