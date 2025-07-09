import { CourseExplorer, HeroSection } from '@components'
import { useUrlNavigation } from '@hooks'
import { buildFacultyUrl, STORAGE_KEYS } from '@utils'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function DegreePage() {
  const navigate = useNavigate()
  const { faculty, degree, isLoading, error } = useUrlNavigation()

  // Store selected faculty and degree
  useEffect(() => {
    if (faculty && degree) {
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_FACULTY_ID,
        faculty.id.toString()
      )
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_DEGREE_ID,
        degree.id.toString()
      )
    }
  }, [faculty, degree])

  // Handle errors
  useEffect(() => {
    if (error === 'faculty-not-found') {
      navigate('/', { replace: true })
    } else if (error === 'degree-not-found' && faculty) {
      navigate(buildFacultyUrl(faculty), { replace: true })
    }
  }, [error, faculty, navigate])

  if (isLoading) {
    return (
      <div>
        <HeroSection showBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-istBlue" />
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!faculty || !degree) {
    return null // Will redirect
  }

  return (
    <div>
      <HeroSection showBreadcrumb />
      <CourseExplorer degreeId={degree.id} />
    </div>
  )
}
