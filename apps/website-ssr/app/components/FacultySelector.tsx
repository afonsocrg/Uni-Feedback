import type { Faculty } from '@uni-feedback/db/schema'
import { SelectionCard } from '.'

interface FacultySelectorProps {
  faculties: Faculty[]
}

export function FacultySelector({ faculties }: FacultySelectorProps) {
  const getFacultyUrl = (faculty: Faculty) => {
    return `/${faculty.slug || faculty.shortName}`
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
          logo={faculty.logo ?? undefined}
        />
      ))}
    </div>
  )
}
