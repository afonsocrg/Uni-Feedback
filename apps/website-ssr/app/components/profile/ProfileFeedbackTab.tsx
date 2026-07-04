import type { UserFeedbackResponse } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { ProfileFeedbackCard } from '../feedback/cards/ProfileFeedbackCard'

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
            <Button variant="outline">{t('profile.my_feedback_browse')}</Button>
          </Link>
        </div>
      )}
    </>
  )
}
