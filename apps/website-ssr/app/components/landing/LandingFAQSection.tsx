import { Trans, useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'
import { FAQ, type FAQItem } from './FAQ'

export function LandingFAQSection() {
  const { t } = useTranslation('landing')
  const lang = useLang()
  const guidelinesUrl = getLocalePath('guidelines', lang)
  const items = t('faq.items', {
    returnObjects: true,
    guidelinesUrl
  }) as FAQItem[]

  return (
    <section id="faq" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4 text-balance">
            {t('faq.title')}
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            {t('faq.subtitle')}
          </p>
          <FAQ items={items} />
          <p className="text-center text-sm text-muted-foreground mt-8">
            <Trans
              i18nKey="faq.contact_prompt"
              ns="landing"
              components={[
                <a
                  href="https://instagram.com/unifeedback"
                  className="text-primary hover:underline font-medium"
                />,
                <a
                  href="mailto:afonso@uni-feedback.com"
                  className="text-primary hover:underline font-medium"
                />
              ]}
            />
          </p>
        </div>
      </div>
    </section>
  )
}
