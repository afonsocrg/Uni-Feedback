import { useTranslation } from 'react-i18next'
import { HeroSearchBar } from './HeroSearchBar'

interface Stats {
  totalFeedback: number
  contributors: number
}

interface HeroSectionProps {
  stats: Stats
}

export function HeroSection({ stats }: HeroSectionProps) {
  const { t } = useTranslation('landing')

  return (
    <section className="flex items-center justify-center py-20 md:py-28 px-4">
      <div className="text-center max-w-3xl w-full">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4 text-balance">
          {t('hero.title')}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
          {t('hero.subtitle')}
        </p>

        <HeroSearchBar />

        <p className="text-xs text-muted-foreground/60 mt-2">
          {t('hero.stats', {
            feedbackCount: stats.totalFeedback.toLocaleString(),
            contributors: stats.contributors
          })}
        </p>
      </div>
    </section>
  )
}
