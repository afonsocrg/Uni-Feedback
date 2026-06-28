import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

export function GiveawayRecapWinner() {
  const { t } = useTranslation('legal')

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-12">
            {t('giveaway_recap.winner_title')}
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Winner Photo */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute -top-3 -right-3 bg-yellow-400 rounded-full p-2 shadow-lg">
                  <Trophy className="size-6 text-yellow-900" />
                </div>
                <img
                  src={getAssetUrl('testimonials/m_ines_goncalves.png')}
                  alt="Maria Inês Gonçalves"
                  className="w-32 h-32 rounded-full object-cover border-4 border-border shadow-lg"
                />
              </div>
            </div>

            {/* Winner Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="text-sm font-semibold text-primary mb-2">
                {t('giveaway_recap.winner_label')}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Maria Inês Gonçalves
              </h3>
              <p className="text-muted-foreground mb-2">Nova SBE</p>
              <p className="text-muted-foreground">
                {t('giveaway_recap.winner_message')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
