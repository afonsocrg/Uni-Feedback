import type { StudentClub } from '@uni-feedback/db'
import { useTranslation } from 'react-i18next'
import type { Lang } from '~/i18n/config'
import { getAssetUrl } from '~/utils'
import { getLocalePath } from '~/utils/i18n-routes'

interface SupportersSectionProps {
  studentClubs: StudentClub[]
}

export function SupportersSection({ studentClubs }: SupportersSectionProps) {
  const { t, i18n } = useTranslation('landing')
  const lang = i18n.language as Lang

  return (
    <>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .supporters-carousel:hover .animate-scroll {
          animation-play-state: paused;
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
          display: flex;
          gap: 2rem;
          width: max-content;
        }
      `}</style>
      <div className="container mx-auto px-4 pt-4 pb-8">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-muted-foreground mb-4">
            {t('supporters_section.title')}
          </p>
          <div className="relative overflow-hidden w-full supporters-carousel">
            <div className="animate-scroll">
              {studentClubs.map((club) => {
                const logoUrl = getAssetUrl(club.logoHorizontal)
                if (!club.logoHorizontal || !logoUrl) return null
                return (
                  <img
                    key={club.id}
                    alt={`${club.name} logo`}
                    src={logoUrl}
                    className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                  />
                )
              })}
              {studentClubs.map((club) => {
                const logoUrl = getAssetUrl(club.logoHorizontal)
                if (!club.logoHorizontal || !logoUrl) return null
                return (
                  <img
                    key={`dup-${club.id}`}
                    alt={`${club.name} logo`}
                    src={logoUrl}
                    className="h-6 md:h-8 flex-shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all"
                  />
                )
              })}
            </div>
          </div>
          <a
            href={getLocalePath('supporters', lang)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-block mt-2"
          >
            {t('supporters_section.see_all')}
          </a>
        </div>
      </div>
    </>
  )
}
