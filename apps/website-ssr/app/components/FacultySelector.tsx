import type { Faculty } from '@uni-feedback/db/schema'
import { Card, CardHeader } from '@uni-feedback/ui'
import { Plus } from 'lucide-react'
import { userPreferences } from '~/utils/userPreferences'
import { SelectionCard } from '.'

interface FacultySelectorProps {
  faculties: Faculty[]
  showAddCard?: boolean
  addCardUrl?: string
}

export function FacultySelector({
  faculties,
  showAddCard = false,
  addCardUrl
}: FacultySelectorProps) {
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

      {showAddCard && addCardUrl && (
        <a
          href={addCardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block no-underline text-inherit hover:no-underline"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full flex flex-col border-dashed border-gray-300 hover:border-gray-400">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 rounded-full bg-gray-100 p-3">
                  <Plus className="h-8 w-8 text-gray-500" />
                </div>
                <div className="flex-1 flex items-center">
                  <p className="text-base font-normal text-gray-600">
                    Add your university!
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </a>
      )}
    </div>
  )
}
