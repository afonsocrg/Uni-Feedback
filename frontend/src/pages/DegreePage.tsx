import { CourseExplorer, HeroSection } from '@components'
import { useFaculties, useFacultyDegrees } from '@hooks'
import { slugToFaculty, slugToDegree, buildFacultyUrl, buildDegreeUrl } from '@utils'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function DegreePage() {
  const { faculty: facultyParam, degree: degreeParam } = useParams()
  const navigate = useNavigate()

  const { data: faculties, isLoading: facultiesLoading } = useFaculties()

  // Find faculty by URL slug
  const faculty = facultyParam && faculties ? slugToFaculty(facultyParam, faculties) : null

  const { data: degrees, isLoading: degreesLoading } = useFacultyDegrees(
    faculty?.id ?? null
  )

  // Find degree by URL slug
  const degree = degreeParam && degrees ? slugToDegree(degreeParam, degrees) : null

  // Store last visited path
  useEffect(() => {
    if (faculty && degree) {
      localStorage.setItem('lastVisitedPath', buildDegreeUrl(faculty, degree))
    }
  }, [faculty, degree])

  // Handle not found cases
  useEffect(() => {
    if (!facultiesLoading && faculties && !faculty) {
      navigate('/', { replace: true })
      return
    }

    if (!degreesLoading && degrees && faculty && !degree) {
      navigate(buildFacultyUrl(faculty), { replace: true })
      return
    }
  }, [
    facultiesLoading,
    degreesLoading,
    faculties,
    degrees,
    faculty,
    degree,
    navigate,
    facultyParam
  ])

  if (facultiesLoading || degreesLoading) {
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
