import type { FeedbackCategories } from '@uni-feedback/api-client'
import {
  calculateFeedbackPoints,
  MAX_FEEDBACK_POINTS
} from '@uni-feedback/utils'
import { Sparkles } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { InfoPopover } from '~/components/common'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getLocalePath } from '~/utils/i18n-routes'

interface FeedbackPointsProgressProps {
  /** Live category detection from the comment (null until enough text). */
  categories: FeedbackCategories | null
  /** Current course, used for analytics. Omit where it isn't available. */
  courseId?: number
}

/**
 * Shows how many points the current feedback will earn and a progress bar
 * toward the maximum, updating live as the comment covers more categories.
 * Points are computed with the same formula the API uses to award them.
 */
export function FeedbackPointsProgress({
  categories,
  courseId
}: FeedbackPointsProgressProps) {
  const { t } = useTranslation('feedback')
  const lang = useLang()

  const points = calculateFeedbackPoints({
    hasTeaching: categories?.hasTeaching ?? false,
    hasAssessment: categories?.hasAssessment ?? false,
    hasMaterials: categories?.hasMaterials ?? false,
    hasTips: categories?.hasTips ?? false
  })
  const progress = Math.round((points / MAX_FEEDBACK_POINTS) * 100)

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-4 shrink-0 text-primaryBlue" />
          <span className="text-sm text-foreground">
            <Trans
              i18nKey="form.points_earn"
              ns="feedback"
              count={points}
              values={{ count: points }}
              components={[<span className="font-semibold text-primaryBlue" />]}
            />
          </span>
          <InfoPopover
            label={t('form.points_help_aria')}
            content={
              <div className="space-y-2">
                <p>{t('form.points_help')}</p>
                <Link
                  to={getLocalePath('points', lang)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    courseId !== undefined &&
                    analytics.feedback.pointsInfoClicked({ courseId, points })
                  }
                  className="inline-block font-medium text-primaryBlue underline hover:text-primaryBlue/80"
                >
                  {t('form.points_help_link')}
                </Link>
              </div>
            }
          />
        </div>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={points}
        aria-valuemin={0}
        aria-valuemax={MAX_FEEDBACK_POINTS}
      >
        <div
          className="h-full rounded-full bg-primaryBlue transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {t('form.points_hint', { max: MAX_FEEDBACK_POINTS })}
      </p>
    </div>
  )
}
