import { FacultySelector, HeroSection } from '@components'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function Home() {
  const navigate = useNavigate()

  // Check for last visited path and redirect
  useEffect(() => {
    const lastVisitedPath = localStorage.getItem('lastVisitedPath')
    if (lastVisitedPath && lastVisitedPath !== '/') {
      // navigate(lastVisitedPath, { replace: true })
    }
  }, [navigate])

  return (
    <div>
      <HeroSection showBreadcrumb />
      <div className="container mx-auto px-4 py-8">
        <FacultySelector />
      </div>
    </div>
  )
}
