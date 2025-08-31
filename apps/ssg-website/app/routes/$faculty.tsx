import { ADD_COURSE_FORM_URL, buildDegreeUrl, insensitiveMatch } from '../utils'
import { HeroSection, SearchDegrees, SelectionCard } from '../components'
import { useFacultyDegrees, useUrlNavigation } from '../hooks'
import type { Degree } from '@uni-feedback/api-client'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { BookOpen, Loader2, MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import type { Route } from "./+types/$faculty";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.faculty} - University Degrees and Courses` },
    { name: "description", content: `Browse degrees and courses for ${params.faculty} university` },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const facultyName = params.faculty
  
  // TODO: Pre-load faculty data and degrees for SSG
  // This could fetch faculty details and degrees from the database
  
  return {
    facultyName,
    // faculty: await getFacultyByShortName(facultyName, context.db),
    // degrees: await getDegreesByFaculty(facultyId, context.db)
  };
}

export default function FacultyPage({ params, loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const { faculty, isLoading, error } = useUrlNavigation()

  const { data: degrees, isLoading: degreesLoading } = useFacultyDegrees(
    faculty?.id ?? null
  )

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Available degree types for filtering
  const availableTypes = useMemo(() => {
    return [...new Set(degrees?.map((degree) => degree.type))].sort()
  }, [degrees])

  // Filtered degrees based on search and type
  const filteredDegrees = useMemo(() => {
    return (
      degrees
        ?.filter((degree) => {
          return insensitiveMatch(
            `${degree.name} ${degree.acronym}`,
            searchQuery
          )
        })
        .filter((degree) => {
          if (selectedType === null) {
            return true
          }
          return degree.type === selectedType
        }) ?? []
    )
  }, [degrees, searchQuery, selectedType])

  const handleDegreeClick = (degree: Degree) => {
    if (!faculty) return
    navigate(buildDegreeUrl(faculty, degree))
  }

  // Show loading state
  if (isLoading || degreesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading degrees...</p>
      </div>
    )
  }

  // Show error state
  if (error || !faculty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <WarningAlert
          title="Faculty not found"
          description="The faculty you're looking for doesn't exist or has been moved."
        />
        <Button
          onClick={() => navigate('/')}
          className="mt-4"
          variant="outline"
        >
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div>
      <HeroSection
        faculty={faculty}
        showBreadcrumb
        showAddCourseButton
        showBackButton
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <SearchDegrees
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          availableTypes={availableTypes}
          resultsCount={filteredDegrees.length}
          totalCount={degrees?.length ?? 0}
        />

        {filteredDegrees.length === 0 && degrees && degrees.length > 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No degrees found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {filteredDegrees.length === 0 && (!degrees || degrees.length === 0) && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No degrees available</h3>
            <p className="text-muted-foreground mb-4">
              This faculty doesn't have any degrees listed yet.
            </p>
            <Button
              onClick={() =>
                window.open(ADD_COURSE_FORM_URL, '_blank', 'noopener')
              }
              variant="outline"
            >
              Suggest a degree
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDegrees.map((degree) => (
            <SelectionCard
              key={degree.id}
              title={degree.name}
              subtitle={degree.acronym}
              description={degree.type}
              onClick={() => handleDegreeClick(degree)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}