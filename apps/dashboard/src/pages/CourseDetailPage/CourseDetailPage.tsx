import { useQuery } from '@tanstack/react-query'
import { getAdminCourseDetails } from '@uni-feedback/api-client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import {
  BookOpen,
  ClipboardCheck,
  Edit3,
  MessageSquare,
  Library
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { InvalidIdError } from '../../components/InvalidIdError'
import { QueryError } from '../../components/QueryError'
import { AssessmentTabContent } from './AssessmentTabContent'
import { BibliographyTabContent } from './BibliographyTabContent'
import { CourseDetailPageSkeleton } from './CourseDetailPageSkeleton'
import { CourseInfoCard } from './CourseInfoCard'
import { DescriptionTabContent } from './DescriptionTabContent'
import { FeedbackTabContent } from './FeedbackTabContent'

function getTabTitle(activeTab: string, feedbackCount?: number): string {
  switch (activeTab) {
    case 'feedback':
      return `Feedback ${feedbackCount ? `(${feedbackCount})` : ''}`
    case 'description':
      return 'Description'
    case 'bibliography':
      return 'Bibliography'
    case 'assessment':
      return 'Assessment'
    default:
      return 'Details'
  }
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Tab state
  const [activeTab, setActiveTab] = useState('feedback')

  const courseId = id ? parseInt(id, 10) : 0

  const {
    data: course,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['course-details', courseId],
    queryFn: () => getAdminCourseDetails(courseId),
    enabled: !!courseId
  })

  if (!courseId) {
    return <InvalidIdError entityType="course" />
  }

  if (error) {
    return (
      <QueryError entityType="course" error={error} onRetry={() => refetch()} />
    )
  }

  if (isLoading || !course) {
    return <CourseDetailPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primaryBlue">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{course.name}</h1>
        </div>
      </div>

      <CourseInfoCard course={course} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="description">
            <Edit3 className="h-4 w-4" />
            <span>Description</span>
          </TabsTrigger>
          <TabsTrigger value="bibliography">
            <Library className="h-4 w-4" />
            <span>Bibliography</span>
          </TabsTrigger>
          <TabsTrigger value="assessment">
            <ClipboardCheck className="h-4 w-4" />
            <span>Assessment</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {getTabTitle(activeTab, course.feedbackCount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="feedback" className="space-y-4">
              <FeedbackTabContent courseId={courseId} />
            </TabsContent>

            <TabsContent value="description" className="space-y-4">
              <DescriptionTabContent course={course} />
            </TabsContent>

            <TabsContent value="bibliography" className="space-y-4">
              <BibliographyTabContent course={course} />
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              <AssessmentTabContent course={course} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}