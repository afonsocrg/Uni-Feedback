import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { i18n } from '~/i18n/config'
import { detectLang, getLocalePath } from '~/utils/i18n-routes'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/giveaway.rules'

export function loader({ request }: Route.LoaderArgs) {
  const origin = getRequestOrigin(request)
  const lang = detectLang(new URL(request.url).pathname)
  return { origin, lang }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { origin, lang } = loaderData
  const t = i18n.getFixedT(lang, 'legal')

  const title = t('giveaway_rules.meta_title')
  const description = t('giveaway_rules.meta_desc')
  const imageUrl = `${origin}/giveaway/og-${lang}.png`

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${origin}/giveaway/rules` },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl }
  ]
}

function StructuredVersion() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  const feedbackItems = t('giveaway_rules.points_feedback_items', {
    returnObjects: true
  }) as string[]
  const drawRuleItems = t('giveaway_rules.prizes_rules_items', {
    returnObjects: true
  }) as string[]

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
          {t('giveaway_rules.page_title')}
        </h1>
        <p className="text-muted-foreground">{t('giveaway_rules.intro')}</p>
      </div>

      {/* 1. Eligibility */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_eligibility')}
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold">
              {t('giveaway_rules.eligibility_status_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.eligibility_status_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold">
              {t('giveaway_rules.eligibility_account_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.eligibility_account_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold">
              {t('giveaway_rules.eligibility_feedback_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.eligibility_feedback_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold">
              {t('giveaway_rules.eligibility_one_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.eligibility_one_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Giveaway Period */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_period')}
        </h2>

        <div className="space-y-4 text-muted-foreground">
          <p>{t('giveaway_rules.period_desc1')}</p>
          <p>{t('giveaway_rules.period_desc2')}</p>
          <p>{t('giveaway_rules.period_winner')}</p>
        </div>
      </section>

      {/* 3. How to Enter */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_enter')}
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.enter_feedback_title')}
            </h3>
            <p className="mb-3 text-muted-foreground">
              {t('giveaway_rules.enter_feedback_desc')}
            </p>
            <p className="text-muted-foreground">
              {t('giveaway_rules.enter_guidelines_prefix')}
              <Link
                to={getLocalePath('guidelines', lang)}
                className="font-medium text-primary hover:underline"
              >
                {t('giveaway_rules.enter_guidelines_link')}
              </Link>
              {t('giveaway_rules.enter_guidelines_suffix')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.enter_existing_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.enter_existing_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Points & Entries */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_points')}
        </h2>

        <div className="space-y-6">
          <p className="font-medium">{t('giveaway_rules.points_intro')}</p>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.points_feedback_title')}
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              {feedbackItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.points_referral_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.points_referral_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.points_instagram_title')}
            </h3>
            <p className="text-muted-foreground">
              <Trans
                i18nKey="giveaway_rules.points_instagram_desc"
                ns="legal"
                components={[
                  <a
                    href="https://www.instagram.com/unifeedback/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  />
                ]}
              />
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.points_quality_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.points_quality_desc')}
            </p>
          </div>

          <p className="text-muted-foreground">
            {t('giveaway_rules.points_which_count')}
          </p>

          <p className="text-muted-foreground">
            {t('giveaway_rules.points_more_prefix')}
            <Link
              to={getLocalePath('points', lang)}
              className="font-medium text-primary hover:underline"
            >
              {t('giveaway_rules.points_more_link')}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 5. Prizes & Winner Selection */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_prizes')}
        </h2>

        <div className="space-y-6">
          <p className="font-medium">{t('giveaway_rules.prizes_desc')}</p>

          <p className="text-muted-foreground">
            {t('giveaway_rules.prizes_split_intro')}
          </p>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.prizes_draw_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.prizes_draw_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.prizes_recruiter_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.prizes_recruiter_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.prizes_rules_title')}
            </h3>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              {drawRuleItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Winner Announcement & Privacy */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_winner')}
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.winner_notification_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.winner_notification_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.winner_announcement_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.winner_announcement_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.winner_claim_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.winner_claim_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 7. Anti-Fraud & Disqualification */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_fraud')}
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.fraud_content_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.fraud_content_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.fraud_referral_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.fraud_referral_desc')}
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-lg font-semibold">
              {t('giveaway_rules.fraud_review_title')}
            </h3>
            <p className="text-muted-foreground">
              {t('giveaway_rules.fraud_review_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 8. Final Notes */}
      <section className="mb-8">
        <h2 className="mb-6 text-2xl font-semibold">
          {t('giveaway_rules.section_final')}
        </h2>

        <div className="space-y-4 text-muted-foreground">
          <p>
            {t('giveaway_rules.final_privacy_prefix')}
            <Link
              to={getLocalePath('privacy', lang)}
              className="font-medium text-primary hover:underline"
            >
              {t('giveaway_rules.final_privacy_link')}
            </Link>
            .
          </p>
          <p>{t('giveaway_rules.final_decisions')}</p>
          <p>
            <Trans
              i18nKey="giveaway_rules.final_questions"
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
      </section>
    </div>
  )
}

export default function GiveawayRulesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <StructuredVersion />
    </div>
  )
}
