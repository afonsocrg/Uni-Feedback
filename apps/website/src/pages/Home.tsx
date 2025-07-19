import { FacultySelector, HeroSection } from '@components'
import { useSelectedFacultyDegree } from '@hooks'
import { buildDegreeUrl, buildFacultyUrl } from '@utils'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()
  const { faculty, degree, isLoading } = useSelectedFacultyDegree()

  // Check for selected faculty/degree and redirect
  useEffect(() => {
    if (isLoading) return

    if (faculty && degree) {
      navigate(buildDegreeUrl(faculty, degree), { replace: true })
    } else if (faculty) {
      navigate(buildFacultyUrl(faculty), { replace: true })
    }
  }, [navigate, faculty, degree, isLoading])

  return (
    <div>
      <HeroSection showBreadcrumb />
      <div className="container mx-auto px-4 py-8">
        <FacultySelector />
      </div>
    </div>
  )
}
