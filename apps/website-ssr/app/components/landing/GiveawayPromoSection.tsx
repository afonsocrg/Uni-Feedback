import { Button } from '@uni-feedback/ui'
import { ArrowRight, Gift } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { GiveawayCountdown } from '~/components/giveaway'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

export function GiveawayPromoSection() {
  const lang = useLang()
  const { t } = useTranslation('landing')

  return (
    <section className="relative overflow-hidden mb-12 bg-gradient-to-br from-slate-900 to-zinc-800">
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-white">
          <div className="flex items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="hidden sm:flex items-center justify-center size-16 md:size-20 rounded-full bg-white/10 backdrop-blur-sm">
              <Gift className="size-8 md:size-10" />
            </div>
            <div>
              <p className="text-sm md:text-base font-medium uppercase tracking-wide text-white/80 mb-1">
                {t('giveaway_promo.eyebrow')}
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight mb-2">
                <Trans
                  i18nKey="giveaway_promo.title"
                  ns="landing"
                  components={{ fnac: <span className="text-[#ecb300]" /> }}
                />
              </h2>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90">
                {t('giveaway_promo.subtitle')}
              </p>
              <div className="mt-3 flex justify-center md:justify-start">
                <GiveawayCountdown variant="compact" />
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="bg-white text-black hover:bg-white/90 shadow-xl shrink-0 text-lg px-8 py-2 h-auto"
            asChild
          >
            <Link to={getLocalePath('giveaway', lang)}>
              {t('giveaway_promo.cta')}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
