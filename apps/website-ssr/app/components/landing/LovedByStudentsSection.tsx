import type { Faculty } from '@uni-feedback/db/schema'
import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

interface LovedByStudentsSectionProps {
  faculties: Faculty[]
}

export function LovedByStudentsSection({
  faculties
}: LovedByStudentsSectionProps) {
  const { t } = useTranslation('landing')

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            {t('loved_by_students.title')}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {faculties.map((faculty) => {
              if (!faculty.logoHorizontal) return null
              const logoUrl = getAssetUrl(faculty.logoHorizontal)

              return (
                <a
                  key={faculty.id}
                  href={faculty.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80"
                >
                  <img
                    alt={`${faculty.name} logo`}
                    src={logoUrl}
                    className="h-12"
                  />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
