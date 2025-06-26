import {
  CourseExplorer,
  DegreeSelectorInline,
  FacultySelector,
  HeroSection
} from '@components'
import { useApp } from '@hooks'

export function Home() {
  const { selectedFacultyId, selectedDegreeId } = useApp()

  // Progressive selection logic
  if (!selectedFacultyId) {
    return (
      <div>
        <HeroSection showBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <FacultySelector />
        </div>
      </div>
    )
  }

  if (!selectedDegreeId) {
    return (
      <div>
        <HeroSection showBreadcrumb />
        <div className="container mx-auto px-4 py-8">
          <DegreeSelectorInline />
        </div>
      </div>
    )
  }

  return (
    <div>
      <HeroSection showBreadcrumb />
      <CourseExplorer />
    </div>
  )
}
