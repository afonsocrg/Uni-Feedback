import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'

export function meta() {
  return buildMeta({
    title: 'How to Write Great Feedback | Uni Feedback',
    description:
      'Learn how to write helpful, honest course reviews that actually help other students make better decisions.'
  })
}

export default function GuidelinesPage() {
  const { t } = useTranslation('legal')
  const lang = useLang()

  const writingItems = [
    {
      lead: t('guidelines.writing_relevant_title'),
      body: t('guidelines.writing_relevant_desc')
    },
    {
      lead: t('guidelines.writing_specific_title'),
      body: t('guidelines.writing_specific_desc')
    },
    {
      lead: t('guidelines.writing_personal_title'),
      body: t('guidelines.writing_personal_desc')
    },
    {
      lead: t('guidelines.writing_friend_title'),
      body: t('guidelines.writing_friend_desc')
    },
    {
      lead: t('guidelines.writing_angry_title'),
      body: t('guidelines.writing_angry_desc')
    }
  ]

  const notAllowedItems = t('guidelines.not_allowed_items', {
    returnObjects: true
  }) as string[]

  const quickRules = t('guidelines.quick_rules', {
    returnObjects: true
  }) as string[]

  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="mb-14">
          <h1 className="mb-4 text-3xl font-semibold md:text-4xl">
            {t('guidelines.title')}
          </h1>
          <div className="space-y-3 text-muted-foreground">
            <p>{t('guidelines.intro1')}</p>
            <p>{t('guidelines.intro2')}</p>
          </div>
        </div>

        {/* Our values */}
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-semibold">
            {t('guidelines.our_values_title')}
          </h2>
          <div className="space-y-5 text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">
                {t('guidelines.value_honest_title')}{' '}
              </span>
              {t('guidelines.value_honest_desc')}
            </p>
            <p>
              <span className="font-semibold text-foreground">
                {t('guidelines.value_helpful_title')}{' '}
              </span>
              {t('guidelines.value_helpful_desc')}
            </p>
          </div>
        </section>

        {/* Writing great feedback */}
        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold">
            {t('guidelines.writing_title')}
          </h2>
          <div className="divide-y">
            {writingItems.map((item) => (
              <div key={item.lead} className="py-5">
                <p className="mb-1 font-semibold">{item.lead}</p>
                <p className="text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-muted-foreground">
            {t('guidelines.writing_critical_note')}
          </p>
        </section>

        {/* Using AI */}
        <section className="mb-14">
          <div className="rounded-lg bg-muted p-6">
            <h2 className="mb-3 text-2xl font-semibold">
              {t('guidelines.ai_title')}
            </h2>
            <p className="text-muted-foreground">{t('guidelines.ai_desc1')}</p>
            <div className="mt-5 space-y-4">
              <p className="text-muted-foreground">
                {t('guidelines.ai_point1')}
              </p>
              <p className="text-muted-foreground">
                {t('guidelines.ai_point2')}
              </p>
            </div>
          </div>
        </section>

        {/* What we don't allow */}
        <section className="mb-14">
          <h2 className="mb-3 text-2xl font-semibold">
            {t('guidelines.not_allowed_title')}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t('guidelines.not_allowed_intro')}
          </p>
          <ul className="space-y-2">
            {notAllowedItems.map((item) => (
              <li key={item} className="text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-muted-foreground">
            {t('guidelines.not_allowed_report')}
          </p>
        </section>

        {/* A few quick rules */}
        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-semibold">
            {t('guidelines.quick_rules_title')}
          </h2>
          <ul className="space-y-2 text-muted-foreground">
            {quickRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <div className="space-y-5 border-t pt-8">
          <p className="text-muted-foreground">
            {t('guidelines.questions')}{' '}
            <a
              href="mailto:afonso@uni-feedback.com"
              className="font-medium text-foreground hover:underline whitespace-nowrap"
            >
              afonso@uni-feedback.com
            </a>
          </p>
          <Button asChild>
            <Link to={getReviewPath(lang)}>
              {t('guidelines.give_feedback_link')}
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('guidelines.full_guidelines_prefix')}{' '}
            <Link
              to={getLocalePath('guidelines-full', lang)}
              className="underline hover:text-foreground"
            >
              {t('guidelines.full_guidelines_link')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
