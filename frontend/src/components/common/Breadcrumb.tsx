import { useApp } from '@hooks'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbProps {
  className?: string
}

export function Breadcrumb({ className = '' }: BreadcrumbProps) {
  const {
    selectedFaculty,
    selectedDegree,
    setSelectedFacultyId,
    setSelectedDegreeId
  } = useApp()

  const handleFacultyClick = () => {
    setSelectedFacultyId(null)
    setSelectedDegreeId(null)
  }

  const handleDegreeClick = () => {
    setSelectedDegreeId(null)
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

      {selectedFaculty && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <button
            onClick={handleDegreeClick}
            className="px-2 py-1 rounded text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 cursor-pointer hover:underline"
          >
            {selectedFaculty.short_name}
          </button>
        </>
      )}

      {selectedFaculty && selectedDegree && (
        <>
          <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
          <span className="px-2 py-1 text-gray-900 font-medium bg-gray-100 rounded">
            {selectedDegree.acronym}
          </span>
        </>
      )}
    </nav>
  )
}
