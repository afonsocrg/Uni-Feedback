import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

import { FAQ, type FAQItem } from '~/components/landing'

export function GiveawayFAQSection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  const items = t('giveaway_page.faq_items', {
    returnObjects: true
  }) as FAQItem[]

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            {t('giveaway_page.faq_title')}
          </h2>
          <p className="text-center text-muted-foreground mb-4">
            {t('giveaway_page.faq_intro_prefix')}
            <Link
              to={getLocalePath('giveaway-rules', lang)}
              className="underline hover:text-foreground"
            >
              {t('giveaway_page.faq_rules_link')}
            </Link>
          </p>
          <FAQ items={items} />
        </div>
      </div>
    </section>
  )
}
