import type { Faculty } from '@uni-feedback/db/schema'
import { useLang } from '~/hooks'
import { getFacultyPath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import { SelectionCard } from '.'

interface FacultySelectorProps {
  faculties: Faculty[]
}

export function FacultySelector({ faculties }: FacultySelectorProps) {
  const lang = useLang()

  const sluggedFaculties = faculties.filter(
    (f): f is Faculty & { slug: string } => f.slug !== null
  )

  const getFacultyUrl = (faculty: Faculty & { slug: string }) =>
    getFacultyPath(lang, faculty.slug)

  const handleFacultyClick = (faculty: Faculty & { slug: string }) => {
    userPreferences.set({
      lastSelectedFacultySlug: faculty.slug,
      lastVisitedPath: getFacultyPath(lang, faculty.slug)
    })
  }

  if (!sluggedFaculties.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No faculties available.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sluggedFaculties.map((faculty) => (
        <SelectionCard
          key={faculty.id}
          title={faculty.shortName}
          subtitle={faculty.name}
          href={getFacultyUrl(faculty)}
          onClick={() => handleFacultyClick(faculty)}
          logo={faculty.logo ?? undefined}
        />
      ))}
    </div>
  )
}
