import type { Faculty } from '@uni-feedback/db/schema'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { SelectionCard } from '.'
import { ADD_COURSE_FORM_URL } from '../utils'

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
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Select Your Uni
        </h1>
        <p className="text-gray-600">
          Choose your uni to browse available degrees and courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculties.map((faculty) => (
          <SelectionCard
            key={faculty.id}
            title={faculty.shortName}
            subtitle={faculty.name}
            href={getFacultyUrl(faculty)}
          />
        ))}
      </div>

      <div className="mt-8">
        <WarningAlert
          message={
            <>
              Don't see your university?{' '}
              <Button
                variant="link"
                size="xs"
                asChild
                className="p-0 h-auto text-sm underline"
              >
                <a
                  href={ADD_COURSE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request it here
                </a>
              </Button>
            </>
          }
        />
      </div>
    </div>
  )
}
