import { Button } from '@uni-feedback/ui'
import { ArrowRight } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'
import { GiveawayCountdown } from './GiveawayCountdown'

export function GiveawayHeroSection() {
  const lang = useLang()
  const { t } = useTranslation('legal')

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-zinc-800">
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
      <div className="relative z-10 container mx-auto px-4 py-24 text-center text-white">
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-sm md:text-base font-semibold uppercase tracking-wide text-white/80 drop-shadow-md">
            {t('giveaway_page.edition_name')}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg">
            <Trans
              i18nKey="giveaway_page.hero_title"
              ns="legal"
              components={{ fnac: <span className="text-fnac" /> }}
            />
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-md">
            {t('giveaway_page.hero_subtitle')}
          </p>
          <GiveawayCountdown className="pt-2" />
          <div className="pt-4 space-y-3">
            <Button
              size="lg"
              className="text-lg px-8 bg-white text-black hover:bg-white/90 shadow-xl"
              asChild
            >
              <a href="#how-to-win">
                {t('giveaway_page.hero_cta_how')}
                <ArrowRight className="size-5" />
              </a>
            </Button>
            <div>
              <Link
                to={getLocalePath('giveaway-rules', lang)}
                className="text-sm text-white/90 hover:text-white underline"
              >
                {t('giveaway_page.hero_cta_rules')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
