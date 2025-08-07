import { AddBadge, EditableBadge, EditableField } from '@components'
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
import { Edit3, ExternalLink, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { openCourseInWebsite } from '../../utils'
import { AddTermDialog } from './AddTermDialog'
import { CourseEditDialog } from './CourseEditDialog'
import { RemoveTermConfirmationDialog } from './RemoveTermConfirmationDialog'

// Utility function to get consistent colors like Chip component
function getChipColorForLabel(label: string) {
  // This mirrors the logic from the Chip component
  const CHIP_COLORS = {
    blue: { bg: '#E3F2FD', text: '#1976D2' },
    green: { bg: '#E8F5E9', text: '#2E7D32' },
    orange: { bg: '#FFF3E0', text: '#E65100' },
    purple: { bg: '#F3E5F5', text: '#7B1FA2' },
    red: { bg: '#FFEBEE', text: '#C62828' },
    cyan: { bg: '#E0F7FA', text: '#00838F' },
    'light-green': { bg: '#F1F8E9', text: '#558B2F' },
    amber: { bg: '#FFF8E1', text: '#F57F17' },
    'deep-purple': { bg: '#EDE7F6', text: '#4527A0' },
    indigo: { bg: '#E8EAF6', text: '#283593' }
  }

  const hash = label.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)

  const colorKeys = Object.keys(CHIP_COLORS) as (keyof typeof CHIP_COLORS)[]
  const index = Math.abs(hash) % colorKeys.length
  return CHIP_COLORS[colorKeys[index]]
}

interface CourseInfoCardProps {
  course: AdminCourseDetail
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isAddTermDialogOpen, setIsAddTermDialogOpen] = useState(false)
  const [isRemoveTermDialogOpen, setIsRemoveTermDialogOpen] = useState(false)
  const [isCourseEditDialogOpen, setIsCourseEditDialogOpen] = useState(false)
  const [termToRemove, setTermToRemove] = useState<string>('')

  const courseId = id ? parseInt(id, 10) : 0

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

  const handleRemoveTerm = (term: string) => {
    setTermToRemove(term)
    setIsRemoveTermDialogOpen(true)
  }

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
                {course.terms && course.terms.length > 0
                  ? course.terms.map((term, index) => (
                      <EditableBadge
                        key={index}
                        value={term}
                        onRemove={handleRemoveTerm}
                        disabled={false}
                        backgroundColor={getChipColorForLabel(term).bg}
                      />
                    ))
                  : null}

                <AddBadge
                  label="Add term"
                  onClick={() => setIsAddTermDialogOpen(true)}
                />
              </dd>

              {(!course.terms || course.terms.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No terms configured. Click "Add term" to add one.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AddTermDialog
        open={isAddTermDialogOpen}
        onOpenChange={setIsAddTermDialogOpen}
        courseId={courseId}
        facultyId={course.facultyId}
        existingTerms={course.terms}
      />

      <RemoveTermConfirmationDialog
        open={isRemoveTermDialogOpen}
        onOpenChange={setIsRemoveTermDialogOpen}
        courseId={courseId}
        termToRemove={termToRemove}
      />

      <CourseEditDialog
        course={course}
        open={isCourseEditDialogOpen}
        onOpenChange={setIsCourseEditDialogOpen}
      />
    </>
  )
}
