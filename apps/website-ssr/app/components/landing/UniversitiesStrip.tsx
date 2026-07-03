import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

interface Faculty {
  id: number
  name: string
  logo: string | null
  logoHorizontal: string | null
}

interface UniversitiesStripProps {
  faculties: Faculty[]
}

export function UniversitiesStrip({ faculties }: UniversitiesStripProps) {
  const { t } = useTranslation('landing')
  const withLogos = faculties.filter((f) => f.logoHorizontal || f.logo)

  if (withLogos.length === 0) return null

  return (
    <div className="w-full py-3 px-4">
      <p className="text-xs text-muted-foreground text-center mb-2">
        {t('universities_strip.prefix')}
      </p>
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 items-center justify-center w-max mx-auto px-2">
          {withLogos.map((faculty) => {
            const logoPath = faculty.logoHorizontal || faculty.logo
            return (
              <span
                key={faculty.id}
                className="inline-flex flex-shrink-0 items-center rounded-md border border-border bg-white px-2.5 py-1.5"
              >
                <img
                  alt={`${faculty.name} logo`}
                  src={getAssetUrl(logoPath!)}
                  className="h-5 object-contain"
                />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
