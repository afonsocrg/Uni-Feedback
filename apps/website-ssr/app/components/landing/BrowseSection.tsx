import { useState } from 'react'
import { getAssetUrl } from '~/utils'

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
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(
    faculties[0]?.id ?? 0
  )

  const selectedFaculty = faculties.find((f) => f.id === selectedFacultyId)

  const filteredDegrees = degrees
    .filter((d) => d.facultyId === selectedFacultyId)
    .slice(0, 9)

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">
              What are you studying?
            </h2>
            {selectedFaculty?.slug && (
              <a
                href={`/${selectedFaculty.slug}`}
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See all degrees →
              </a>
            )}
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
                  <img
                    src={getAssetUrl(faculty.logo)}
                    alt=""
                    className="size-4 object-contain flex-shrink-0"
                  />
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
                    <img
                      src={getAssetUrl(faculty.logo)}
                      alt=""
                      className="size-5 object-contain flex-shrink-0"
                    />
                  )}
                  {faculty.shortName}
                </button>
              ))}
            </div>

            {/* Right: degrees grid */}
            <DegreeGrid degrees={filteredDegrees} />
          </div>

          {/* Mobile: degree grid */}
          <div className="md:hidden">
            <DegreeGrid degrees={filteredDegrees} mobileLimit={6} />
            {selectedFaculty?.slug && (
              <div className="text-center mt-4">
                <a
                  href={`/${selectedFaculty.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  See all degrees →
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
  mobileLimit
}: {
  degrees: DegreeWithStats[]
  mobileLimit?: number
}) {
  if (degrees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No degrees available for this university yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
      {degrees.map((degree, i) => {
        const href =
          degree.faculty.slug && degree.slug
            ? `/${degree.faculty.slug}/${degree.slug}`
            : '/browse'
        const hiddenOnMobile =
          mobileLimit !== undefined && i >= mobileLimit ? 'hidden md:block' : ''
        return (
          <a
            key={degree.id}
            href={href}
            className={`group flex flex-col bg-background rounded-xl border p-4 hover:border-primary hover:shadow-sm transition-all ${hiddenOnMobile}`}
          >
            <div className="flex-1">
              <p className="font-medium text-sm group-hover:text-primary transition-colors">
                {degree.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {degree.acronym}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {degree.courseCount > 0 && (
                <span className="text-xs text-muted-foreground/70">
                  {degree.courseCount} course
                  {degree.courseCount !== 1 ? 's' : ''}
                </span>
              )}
              {degree.feedbackCount > 0 && (
                <span className="text-xs text-muted-foreground/70">
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
