import type { Faculty, University } from '@uni-feedback/db/schema'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { getFacultyPath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import { SelectionCard } from '.'

/** A faculty carrying the university it belongs to, or null if unassigned. */
export type FacultyWithUniversity = Faculty & {
  university: University | null
}

interface FacultySelectorProps {
  faculties: FacultyWithUniversity[]
  /** Called with the faculty and its 0-based position in the rendered grid. */
  onSelect?: (faculty: FacultyWithUniversity, index: number) => void
}

export function FacultySelector({ faculties, onSelect }: FacultySelectorProps) {
  const { t } = useTranslation('browse')
  const lang = useLang()

  const sluggedFaculties = faculties.filter(
    (f): f is FacultyWithUniversity & { slug: string } => f.slug !== null
  )

  const handleFacultyClick = (
    faculty: FacultyWithUniversity & { slug: string },
    index: number
  ) => {
    userPreferences.set({
      lastSelectedFacultySlug: faculty.slug,
      lastVisitedPath: getFacultyPath(lang, faculty.slug)
    })
    onSelect?.(faculty, index)
  }

  if (!sluggedFaculties.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('page.no_results')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sluggedFaculties.map((faculty, index) => (
        <SelectionCard
          key={faculty.id}
          title={faculty.shortName}
          subtitle={faculty.name}
          href={getFacultyPath(lang, faculty.slug)}
          onClick={() => handleFacultyClick(faculty, index)}
          logo={faculty.logo ?? undefined}
        />
      ))}
    </div>
  )
}
