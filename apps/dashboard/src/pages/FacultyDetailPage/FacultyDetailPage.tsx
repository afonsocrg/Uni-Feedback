import { useQuery } from '@tanstack/react-query'
import { getFacultyDetails } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { Building2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { FacultyDegreesCard } from './FacultyDegreesCard'
import { FacultyInfoCard } from './FacultyInfoCard'
import { FacultyPageSkeleton } from './FacultyPageSkeleton'

export function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>()

  const facultyId = id ? parseInt(id, 10) : 0

  const {
    data: faculty,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['faculty-details', facultyId],
    queryFn: () => getFacultyDetails(facultyId),
    enabled: !!facultyId
  })

  if (!facultyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Invalid faculty ID
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Failed to load faculty details
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading || !faculty) {
    return <FacultyPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primaryBlue">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{faculty.name}</h1>
        </div>
      </div>

      <FacultyInfoCard faculty={faculty} />

      <FacultyDegreesCard faculty={faculty} />
    </div>
  )
}
