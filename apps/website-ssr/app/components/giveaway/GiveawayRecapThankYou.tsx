import { Heart } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

export function GiveawayRecapThankYou() {
  const { t } = useTranslation('legal')

  return (
    <section className="py-16 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-[300px_1fr] gap-8 md:gap-12 items-center">
            {/* Left side - Thank you heading */}
            <div className="text-center">
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                {t('giveaway_recap.thanks_title')}
              </h2>
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Heart className="size-8 text-primary fill-primary" />
                </div>
              </div>
            </div>

            {/* Right side - Message */}
            <div className="space-y-4 md:text-lg text-muted-foreground">
              <p>{t('giveaway_recap.thanks_p1')}</p>

              <p className="text-medium md:text-xl font-semibold text-foreground">
                <Trans
                  i18nKey="giveaway_recap.thanks_p2"
                  ns="legal"
                  components={[<span className="text-primary" />]}
                />
              </p>

              <p>{t('giveaway_recap.thanks_p3')}</p>

              <p className="font-medium text-foreground">
                {t('giveaway_recap.thanks_p4')}
              </p>

              <div className="pt-4 flex items-center gap-4">
                <img
                  src={getAssetUrl('giveaway/afonsocrg.jpeg')}
                  alt="Afonso"
                  className="size-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-lg md:text-xl font-semibold text-foreground">
                    {t('giveaway_recap.thanks_signoff')}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {t('giveaway_recap.thanks_author')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
