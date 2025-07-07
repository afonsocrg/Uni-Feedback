import { CourseExplorer, HeroSection } from '@components'
import { useUrlNavigation } from '@hooks'
import { buildDegreeUrl, buildFacultyUrl } from '@utils'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function DegreePage() {
  const navigate = useNavigate()
  const { faculty, degree, isLoading, error } = useUrlNavigation()

  // Store last visited path
  useEffect(() => {
    if (faculty && degree) {
      localStorage.setItem('lastVisitedPath', buildDegreeUrl(faculty, degree))
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      <CourseExplorer facultyId={faculty.id} degreeId={degree.id} />
    </div>
  )
}
