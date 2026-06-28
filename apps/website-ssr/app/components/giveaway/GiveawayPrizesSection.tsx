import { Crown, Dices } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

export function GiveawayPrizesSection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  const prizes = [
    {
      icon: Dices,
      tag: t('giveaway_page.prizes_random_tag'),
      title: t('giveaway_page.prizes_random_title'),
      descriptionKey: 'giveaway_page.prizes_random_desc' as const
    },
    {
      icon: Crown,
      tag: t('giveaway_page.prizes_ambassador_tag'),
      title: t('giveaway_page.prizes_ambassador_title'),
      descriptionKey: 'giveaway_page.prizes_ambassador_desc' as const
    }
  ]

  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-3">
            {t('giveaway_page.prizes_title')}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('giveaway_page.prizes_subtitle')}
          </p>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center bg-white rounded-2xl border p-8 shadow-sm"
              >
                <div className="shrink-0 size-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <prize.icon className="size-8 text-primary" />
                </div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-full px-3 py-1 mb-3">
                  {prize.tag}
                </span>
                <h3 className="text-xl font-semibold mb-2">{prize.title}</h3>
                <p className="text-muted-foreground">
                  <Trans
                    i18nKey={prize.descriptionKey}
                    t={t}
                    components={{
                      profileLink: (
                        <Link
                          to={getLocalePath('profile', lang)}
                          className="font-medium text-primary underline hover:text-primary/80"
                        />
                      )
                    }}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
