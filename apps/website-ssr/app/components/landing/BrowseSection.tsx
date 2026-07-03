import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getAssetUrl } from '~/utils'
import {
  getDegreePath,
  getFacultyPath,
  getLocalePath,
  type Lang
} from '~/utils/i18n-routes'

interface FacultyInfo {
  id: number
  name: string
  shortName: string
  slug: string | null
  logo: string | null
}

interface DegreeWithStats {
  id: number
  name: string
  acronym: string
  slug: string | null
  facultyId: number | null
  courseCount: number
  feedbackCount: number
  faculty: FacultyInfo
}

interface BrowseSectionProps {
  faculties: FacultyInfo[]
  degrees: DegreeWithStats[]
}

export function BrowseSection({ faculties, degrees }: BrowseSectionProps) {
  const { t } = useTranslation('landing')
  const lang = useLang()
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(
    faculties[0]?.id ?? 0
  )

  const selectedFaculty = faculties.find((f) => f.id === selectedFacultyId)

  const allFilteredDegrees = degrees.filter(
    (d) => d.facultyId === selectedFacultyId
  )
  const filteredDegrees = allFilteredDegrees.slice(0, 9)

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-balance">
              {t('browse_section.title')}
            </h2>
          </div>

          {/* Mobile: tabs */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-2">
            {faculties.map((faculty) => (
              <button
                key={faculty.id}
                onClick={() => setSelectedFacultyId(faculty.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFacultyId === faculty.id
                    ? 'bg-muted-foreground/20 text-foreground'
                    : 'bg-background text-muted-foreground hover:text-foreground border'
                }`}
              >
                {faculty.logo && (
                  <span className="inline-flex flex-shrink-0 items-center justify-center rounded-[3px] bg-white p-0.5">
                    <img
                      src={getAssetUrl(faculty.logo)}
                      alt=""
                      className="size-4 object-contain"
                    />
                  </span>
                )}
                {faculty.shortName}
              </button>
            ))}
          </div>

          {/* Desktop: two-column */}
          <div className="hidden md:grid md:grid-cols-[200px_1fr] gap-6">
            {/* Left: faculty list */}
            <div className="space-y-1">
              {faculties.map((faculty) => (
                <button
                  key={faculty.id}
                  onClick={() => setSelectedFacultyId(faculty.id)}
                  className={`cursor-pointer w-full text-left flex items-center gap-2.5 px-3 py-4 rounded-lg text-sm font-medium transition-colors ${
                    selectedFacultyId === faculty.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {faculty.logo && (
                    <span className="inline-flex flex-shrink-0 items-center justify-center rounded-[3px] bg-white p-0.5">
                      <img
                        src={getAssetUrl(faculty.logo)}
                        alt=""
                        className="size-5 object-contain"
                      />
                    </span>
                  )}
                  {faculty.shortName}
                </button>
              ))}
            </div>

            {/* Right: degrees grid + footer link */}
            <div className="flex flex-col gap-3">
              <DegreeGrid degrees={filteredDegrees} lang={lang} />
              {selectedFaculty?.slug && allFilteredDegrees.length > 9 && (
                <div className="text-right">
                  <a
                    href={getFacultyPath(lang, selectedFaculty.slug)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t('browse_section.see_all')}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: degree grid */}
          <div className="md:hidden">
            <DegreeGrid degrees={filteredDegrees} mobileLimit={6} lang={lang} />
            {selectedFaculty?.slug && allFilteredDegrees.length > 6 && (
              <div className="text-center mt-4">
                <a
                  href={getFacultyPath(lang, selectedFaculty.slug)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('browse_section.see_all')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DegreeGrid({
  degrees,
  mobileLimit,
  lang
}: {
  degrees: DegreeWithStats[]
  mobileLimit?: number
  lang: Lang
}) {
  const { t } = useTranslation('landing')
  if (degrees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {t('browse_section.no_degrees')}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
      {degrees.map((degree, i) => {
        const href =
          degree.faculty.slug && degree.slug
            ? getDegreePath(lang, degree.faculty.slug, degree.slug)
            : getLocalePath('browse', lang)
        const hiddenOnMobile =
          mobileLimit !== undefined && i >= mobileLimit ? 'hidden md:block' : ''
        return (
          <a
            key={degree.id}
            href={href}
            className={`group flex flex-col bg-background rounded-xl border p-4 hover:border-interactive hover:shadow-sm transition-all ${hiddenOnMobile}`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm">{degree.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {degree.acronym}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
              {degree.courseCount > 0 && (
                <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                  {degree.courseCount} course
                  {degree.courseCount !== 1 ? 's' : ''}
                </span>
              )}
              {degree.feedbackCount > 0 && (
                <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                  {degree.feedbackCount} feedback
                  {degree.feedbackCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </a>
        )
      })}
    </div>
  )
}
