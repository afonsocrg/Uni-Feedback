import { EditableField } from '@components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCourseDetail, updateCourse } from '@uni-feedback/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { Edit3, ExternalLink, FileText, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { openCourseInWebsite } from '../../utils'
import { CourseEditDialog } from './CourseEditDialog'
import { GenerateReportDialog } from './GenerateReportDialog'

interface CourseInfoCardProps {
  course: AdminCourseDetail
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isCourseEditDialogOpen, setIsCourseEditDialogOpen] = useState(false)
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] =
    useState(false)

  const courseId = id ? parseInt(id, 10) : 0

  // Distinct academic term names this course is offered in. Offering
  // management (add/remove) is deferred; this view is read-only for now.
  const termNames = Array.from(
    new Set(course.offerings.map((o) => o.academicTerm.name))
  )

  const updateMutation = useMutation({
    mutationFn: (updates: {
      name?: string
      acronym?: string
      ects?: number | null
    }) => updateCourse(courseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast.success('Course updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course'
      )
    }
  })

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Course Information
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsGenerateReportDialogOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCourseInWebsite(course.id)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Course
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCourseEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Faculty and Degree at the top with colors */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Faculty › Degree</dt>
              <dd className="flex gap-2 flex-wrap">
                <Chip
                  label={course.facultyName}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/faculties/${course.facultyId}`)}
                />
                <Chip
                  label={`${course.degreeName} (${course.degreeAcronym})`}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/degrees/${course.degreeId}`)}
                />
              </dd>
            </div>

            <EditableField
              label="Name"
              value={course.name}
              onSave={(value) => {
                updateMutation.mutate({ name: value })
              }}
              disabled={updateMutation.isPending}
            />

            <EditableField
              label="Acronym"
              value={course.acronym}
              onSave={(value) => {
                updateMutation.mutate({ acronym: value })
              }}
              disabled={updateMutation.isPending}
            />

            <EditableField
              label="ECTS"
              value={course.ects?.toString() || ''}
              onSave={(value) => {
                updateMutation.mutate({
                  ects: value === '' ? null : Number(value)
                })
              }}
              disabled={updateMutation.isPending}
              type="number"
              // placeholder="Enter ECTS credits"
            />

            {/* Terms */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <dt className="font-medium text-sm">Terms</dt>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Academic terms when this course is available (e.g.,
                        Fall, Spring, Summer)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <dd className="flex flex-wrap gap-2">
                {termNames.length > 0
                  ? termNames.map((name) => <Chip key={name} label={name} />)
                  : null}
              </dd>

              {termNames.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No offerings configured for this course.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <CourseEditDialog
        course={course}
        open={isCourseEditDialogOpen}
        onOpenChange={setIsCourseEditDialogOpen}
      />

      <GenerateReportDialog
        open={isGenerateReportDialogOpen}
        onOpenChange={setIsGenerateReportDialogOpen}
        courseId={courseId}
        courseName={course.name}
      />
    </>
  )
}
