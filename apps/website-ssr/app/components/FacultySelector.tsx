import type { Faculty } from '@uni-feedback/db/schema'
import { userPreferences } from '~/utils/userPreferences'
import { SelectionCard } from '.'

interface FacultySelectorProps {
  faculties: Faculty[]
}

export function FacultySelector({ faculties }: FacultySelectorProps) {
  const getFacultyUrl = (faculty: Faculty) => {
    return `/${faculty.slug}`
  }

  const handleFacultyClick = (faculty: Faculty) => {
    // Save to localStorage immediately when user clicks
    userPreferences.set({
      lastSelectedFacultySlug: faculty.slug,
      lastVisitedPath: `/${faculty.slug}`
    })
  }

  if (!faculties || faculties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No faculties available.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {faculties.map((faculty) => (
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
