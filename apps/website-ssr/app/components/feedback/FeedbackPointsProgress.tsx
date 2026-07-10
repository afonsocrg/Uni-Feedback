import type { FeedbackCategories } from '@uni-feedback/api-client'
import {
  calculateFeedbackPoints,
  getGiveawaySchoolYear,
  isGiveawayActive,
  MAX_FEEDBACK_POINTS
} from '@uni-feedback/utils'
import { Info, Sparkles } from 'lucide-react'
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
  /**
   * School year the feedback is being written for. Drives whether we say these
   * points count toward the giveaway: only the giveaway year's feedback does.
   * Omit where the year isn't selectable (the giveaway note is then hidden).
   */
  schoolYear?: number
}

/**
 * Shows how many points the current feedback will earn and a progress bar
 * toward the maximum, updating live as the comment covers more categories.
 * Points are computed with the same formula the API uses to award them.
 *
 * When the giveaway is live, it also states whether the selected school year
 * earns giveaway entries. Students can review courses up to 5 years back, and
 * only the current year counts, so saying nothing reads as a promise we break.
 */
export function FeedbackPointsProgress({
  categories,
  courseId,
  schoolYear
}: FeedbackPointsProgressProps) {
  const { t } = useTranslation('feedback')
  const lang = useLang()

  const giveawayActive = isGiveawayActive()
  const countsForGiveaway = schoolYear === getGiveawaySchoolYear()
  const showGiveawayNote = giveawayActive && schoolYear !== undefined

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

      {showGiveawayNote &&
        (countsForGiveaway ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('form.points_giveaway_counts')}
          </p>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-tint-amber-border bg-tint-amber p-2.5">
            <Info className="mt-px size-3.5 shrink-0 text-tint-amber-fg" />
            <div className="space-y-1 text-xs text-tint-amber-fg">
              <p>{t('form.points_giveaway_excluded')}</p>
              {/* The year has a purpose beyond the giveaway. Saying so keeps
                  the notice from reading as "switch the year to qualify". */}
              <p className="opacity-90">
                {t('form.points_giveaway_excluded_why')}
              </p>
            </div>
          </div>
        ))}
    </div>
  )
}
