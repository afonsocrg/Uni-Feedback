import { ADD_COURSE_FORM_URL, buildFacultyUrl } from '@/utils'
import { SelectionCard, WarningAlert } from '@components'
import { useFaculties } from '@hooks'
import type { Faculty } from '@services/meicFeedbackAPI'
import { Button } from '@ui/button'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function FacultySelector() {
  const navigate = useNavigate()
  const { data: faculties, isLoading } = useFaculties()

  const handleFacultySelect = (faculty: Faculty) => {
    navigate(buildFacultyUrl(faculty))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
        <p className="mt-4 text-gray-600">Loading faculties...</p>
      </div>
    )
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
            title={faculty.short_name}
            subtitle={faculty.name}
            onClick={() => handleFacultySelect(faculty)}
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
