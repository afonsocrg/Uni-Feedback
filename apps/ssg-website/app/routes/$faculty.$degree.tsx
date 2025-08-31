import { CourseExplorer, HeroSection } from '../components'
import { useUrlNavigation } from '../hooks'
import { buildFacultyUrl, STORAGE_KEYS } from '../utils'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'

import type { Route } from "./+types/$faculty.$degree";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.degree} - ${params.faculty} University` },
    { name: "description", content: `Browse courses and reviews for ${params.degree} degree at ${params.faculty}` },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const facultyName = params.faculty
  const degreeName = params.degree
  
  // TODO: Pre-load degree and courses data for SSG
  // This could fetch degree details and courses from the database
  
  return {
    facultyName,
    degreeName,
    // faculty: await getFacultyByShortName(facultyName, context.db),
    // degree: await getDegreeByAcronym(degreeName, context.db),
    // courses: await getCoursesByDegree(degreeId, context.db)
  };
}

export default function DegreePage({ params, loaderData }: Route.ComponentProps) {
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Loading courses...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !faculty || !degree) {
    return (
      <div>
        <HeroSection showBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              {error === 'faculty-not-found' && 'Faculty not found'}
              {error === 'degree-not-found' && 'Degree not found'}
              {!error && 'Something went wrong'}
            </h2>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <HeroSection
        faculty={faculty}
        degree={degree}
        showBreadcrumb
        showAddCourseButton
        showBackButton
      />
      
      <div className="container mx-auto px-4 py-8">
        <CourseExplorer facultyId={faculty.id} degreeId={degree.id} />
      </div>
    </div>
  )
}