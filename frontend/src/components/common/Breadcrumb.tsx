import { useFaculties, useFacultyDegrees } from '@hooks'
import { slugToFaculty, slugToDegree, buildFacultyUrl } from '@utils'
import { ChevronRight, Home } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

interface BreadcrumbProps {
  className?: string
}

export function Breadcrumb({ className = '' }: BreadcrumbProps) {
  const navigate = useNavigate()
  const { faculty: facultyParam, degree: degreeParam } = useParams()
  
  const { data: faculties } = useFaculties()
  
  // Find faculty by URL parameter
  const faculty = facultyParam && faculties ? slugToFaculty(facultyParam, faculties) : null
  
  const { data: degrees } = useFacultyDegrees(faculty?.id ?? null)
  
  // Find degree by URL parameter
  const degree = degreeParam && degrees ? slugToDegree(degreeParam, degrees) : null

  const handleFacultyClick = () => {
    navigate('/')
  }

  const handleDegreeClick = () => {
    if (faculty) {
      navigate(buildFacultyUrl(faculty))
    }
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      <button
        onClick={handleFacultyClick}
        className="flex items-center px-2 py-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 cursor-pointer hover:underline"
      >
        <Home className="h-4 w-4 mr-1" />
        Select Uni
      </button>

      {faculty && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <button
            onClick={handleDegreeClick}
            className="px-2 py-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 cursor-pointer hover:underline"
          >
            {faculty.short_name}
          </button>
        </>
      )}

      {faculty && degree && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <span className="px-2 py-1 text-gray-900 font-medium bg-gray-100 rounded">
            {degree.acronym}
          </span>
        </>
      )}
    </nav>
  )
}
