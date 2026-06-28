import { Button } from '@uni-feedback/ui'
import { ArrowRight, LogIn, PenSquare, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getReviewPath } from '~/utils/i18n-routes'

export function HowToWinSection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  const steps = [
    {
      icon: LogIn,
      title: t('giveaway_page.howto_step1_title'),
      description: t('giveaway_page.howto_step1_desc')
    },
    {
      icon: PenSquare,
      title: t('giveaway_page.howto_step2_title'),
      description: t('giveaway_page.howto_step2_desc')
    },
    {
      icon: Trophy,
      title: t('giveaway_page.howto_step3_title'),
      description: t('giveaway_page.howto_step3_desc')
    }
  ]

  return (
    <section id="how-to-win" className="bg-white py-16 md:py-24 scroll-mt-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-8">
            {t('giveaway_page.howto_title')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-12 mb-12">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 md:flex-col md:items-center md:text-center md:gap-4"
              >
                <div className="shrink-0 size-12 md:size-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="size-6 md:size-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a
                href={`${getReviewPath(lang)}?from=giveaway`}
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'giveaway_how_to_win',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }}
              >
                {t('giveaway_page.howto_cta')}
                <ArrowRight className="size-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
