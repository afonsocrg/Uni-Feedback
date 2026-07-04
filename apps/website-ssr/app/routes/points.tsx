import { PenSquare, Users } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { InfoPopover } from '~/components/common'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import {
  FEEDBACK_CATEGORIES,
  type FeedbackCategoryKey,
  INSTAGRAM_URL
} from '~/utils/constants'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/points'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('points.meta_title'),
    description: t('points.meta_desc')
  })
}

export default function PointsPage() {
  const { t } = useTranslation('legal')
  const { t: tFeedback } = useTranslation('feedback')
  const lang = useLang()

  const categoryLabels: Record<
    FeedbackCategoryKey,
    { title: string; description: string }
  > = {
    teaching: {
      title: tFeedback('categories.teaching.title'),
      description: tFeedback('categories.teaching.description')
    },
    assessment: {
      title: tFeedback('categories.assessment.title'),
      description: tFeedback('categories.assessment.description')
    },
    materials: {
      title: tFeedback('categories.materials.title'),
      description: tFeedback('categories.materials.description')
    },
    tips: {
      title: tFeedback('categories.tips.title'),
      description: tFeedback('categories.tips.description')
    }
  }

  const giveFeedbackPoints = t('points.give_feedback_points', {
    returnObjects: true
  }) as string[]

  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
            {t('points.page_title')}
          </h1>
          <p className="text-muted-foreground">
            <span className="text-lg font-semibold">
              {t('points.intro_highlight')}
            </span>
            <br />
            {t('points.intro_rest')}
          </p>
        </div>

        {/* How You Earn Points */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl font-semibold">
            {t('points.how_to_earn')}
          </h2>

          <div className="grid gap-12 md:grid-cols-2">
            {/* Give Feedback */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <PenSquare className="size-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">
                  {t('points.give_feedback_title')}
                </h3>
              </div>
              <p className="text-muted-foreground">
                <Trans
                  i18nKey="points.give_feedback_desc"
                  ns="legal"
                  components={[
                    <Link
                      to={getLocalePath('guidelines', lang)}
                      className="font-medium underline hover:text-foreground"
                    />
                  ]}
                />
              </p>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-muted-foreground mb-3">
                {giveFeedbackPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
              <p className="text-muted-foreground">
                <Trans
                  i18nKey="points.give_feedback_cta"
                  ns="legal"
                  components={[
                    <Link
                      to={`${getReviewPath(lang)}?from=points`}
                      className="font-medium text-primary hover:underline"
                      onClick={() => {
                        analytics.navigation.feedbackFormLinkClicked({
                          source: 'points_page',
                          referrerPage: getPageName(window.location.pathname)
                        })
                      }}
                    />
                  ]}
                />
              </p>
            </div>

            {/* Invite Friends */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">
                  {t('points.invite_title')}
                </h3>
              </div>
              <p className="text-muted-foreground">{t('points.invite_desc')}</p>
              <p className="text-muted-foreground mt-2">
                <Trans
                  i18nKey="points.invite_from_profile"
                  ns="legal"
                  components={[
                    <Link
                      to={getLocalePath('profile', lang)}
                      className="font-medium text-primary hover:underline"
                    />
                  ]}
                />
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              <Trans
                i18nKey="points.check_points"
                ns="legal"
                components={[
                  <Link
                    to={getLocalePath('profile', lang)}
                    className="font-medium text-primary hover:underline"
                  />
                ]}
              />
            </p>
          </div>
        </section>

        {/* Giveaway Bonus Points (time-limited) */}
        <section className="mb-16">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                {t('points.giveaway_bonus_badge')}
              </span>
            </div>
            <h2 className="mb-2 text-2xl font-semibold">
              {t('points.giveaway_bonus_title')}
            </h2>
            <p className="mb-6 text-muted-foreground">
              <Trans
                i18nKey="points.giveaway_bonus_desc"
                ns="legal"
                components={[
                  <Link
                    to={getLocalePath('giveaway', lang)}
                    className="font-medium text-primary hover:underline"
                  />
                ]}
              />
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 font-medium">
                  <span>
                    {t('points.giveaway_bonus_instagram_label')}{' '}
                    <span className="text-primary">
                      {t('points.giveaway_bonus_instagram_value')}
                    </span>
                  </span>
                  <InfoPopover
                    content={t('points.giveaway_bonus_instagram_privacy')}
                    label={t('points.giveaway_bonus_instagram_privacy')}
                  />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <Trans
                    i18nKey="points.giveaway_bonus_instagram_desc"
                    ns="legal"
                    components={[
                      <a
                        href={INSTAGRAM_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-foreground underline hover:text-primary"
                      />,
                      <Link
                        to={getLocalePath('profile', lang)}
                        className="font-medium text-foreground underline hover:text-primary"
                      />
                    ]}
                  />
                </p>
              </div>
              <div>
                <p className="font-medium">
                  {t('points.giveaway_bonus_quality_label')}{' '}
                  <span className="text-primary">
                    {t('points.giveaway_bonus_quality_value')}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('points.giveaway_bonus_quality_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Categories */}
        <section id="feedback-categories" className="mb-16">
          <h2 className="mb-2 text-2xl font-semibold">
            {t('points.categories_title')}
          </h2>
          <p className="mb-8 text-muted-foreground">
            {t('points.categories_desc')}
          </p>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {FEEDBACK_CATEGORIES.map((category) => (
              <div key={category.key} className="flex gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <category.icon className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {categoryLabels[category.key].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {categoryLabels[category.key].description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <div className="border-t pt-8">
          <p className="text-muted-foreground text-sm">
            <Trans
              i18nKey="points.questions"
              ns="legal"
              components={[
                <a
                  href="mailto:afonso@uni-feedback.com"
                  className="font-medium text-primary hover:underline"
                />
              ]}
            />
          </p>
        </div>
      </div>
    </div>
  )
}
