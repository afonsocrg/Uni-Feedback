import { useQuery } from '@tanstack/react-query'
import { getAdminDegreeDetails } from '@uni-feedback/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import { BookOpen, Edit3, GraduationCap, Users } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CourseGroupsTabContent } from './CourseGroupsTabContent'
import { CoursesTabContent } from './CoursesTabContent'
import { DegreeInfoCard } from './DegreeInfoCard'
import { DescriptionTabContent } from './DescriptionTabContent'

function getTabTitle(activeTab: string): string {
  switch (activeTab) {
    case 'courses':
      return `Courses`
    case 'course-groups':
      return `Course Groups`
    case 'description':
      return 'Description'
    default:
      return 'Details'
  }
}

export function DegreeDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Tab state
  const [activeTab, setActiveTab] = useState('courses')

  const degreeId = id ? parseInt(id, 10) : 0

  const {
    data: degree,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['degree-details', degreeId],
    queryFn: () => getAdminDegreeDetails(degreeId),
    enabled: !!degreeId
  })

  if (!degreeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            Invalid degree ID
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
            Failed to load degree details
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

  if (isLoading || !degree) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primaryBlue">
          <GraduationCap className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{degree.name}</h1>
        </div>
      </div>

      <DegreeInfoCard degree={degree} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </TabsTrigger>
          <TabsTrigger value="course-groups">
            <Users className="h-4 w-4" />
            <span>Course Groups</span>
          </TabsTrigger>
          <TabsTrigger value="description">
            <Edit3 className="h-4 w-4" />
            Description
          </TabsTrigger>
        </TabsList>

        {/* Tab Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>{getTabTitle(activeTab)}</CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="courses" className="space-y-4">
              <CoursesTabContent degreeId={degreeId} />
            </TabsContent>

            <TabsContent value="course-groups" className="space-y-4">
              <CourseGroupsTabContent degreeId={degreeId} />
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <DescriptionTabContent degree={degree} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
