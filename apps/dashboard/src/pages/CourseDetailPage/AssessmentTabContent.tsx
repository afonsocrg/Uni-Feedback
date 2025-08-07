import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCourseDetail, updateCourse } from '@uni-feedback/api-client'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Markdown,
  MarkdownTextarea
} from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface AssessmentTabContentProps {
  course: AdminCourseDetail
}

export function AssessmentTabContent({ course }: AssessmentTabContentProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [assessment, setAssessment] = useState(course.assessment || '')
  const [hasMandatoryExam, setHasMandatoryExam] = useState(
    course.hasMandatoryExam ?? false
  )

  const courseId = id ? parseInt(id, 10) : 0

  const updateMutation = useMutation({
    mutationFn: (updates: {
      assessment?: string | null
      hasMandatoryExam?: boolean | null
    }) => updateCourse(courseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsEditDialogOpen(false)
      toast.success('Course assessment updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update course assessment'
      )
    }
  })

  const handleSave = () => {
    const trimmedAssessment = assessment.trim()
    updateMutation.mutate({
      assessment: trimmedAssessment || null,
      hasMandatoryExam
    })
  }

  const handleCancel = () => {
    setAssessment(course.assessment || '')
    setHasMandatoryExam(course.hasMandatoryExam ?? false)
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Assessment Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Assessment Details</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Assessment
            </Button>
          </div>

          <div className="min-h-32 p-4 border rounded-md bg-muted/50">
            {course.assessment ? (
              <div className="prose prose-sm max-w-none">
                <Markdown>{course.assessment}</Markdown>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No assessment details available for this course.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Add Assessment Details
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mandatory Exam Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Exam Requirements</h3>
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  course.hasMandatoryExam === true
                    ? 'bg-red-500'
                    : course.hasMandatoryExam === false
                      ? 'bg-green-500'
                      : 'bg-gray-400'
                }`}
              />
              <div>
                <p className="text-sm font-medium">
                  {course.hasMandatoryExam === true
                    ? 'Mandatory Exam Required'
                    : course.hasMandatoryExam === false
                      ? 'No Mandatory Exam'
                      : 'Exam Requirement Not Specified'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {course.hasMandatoryExam === true
                    ? 'Students must take a mandatory exam to complete this course'
                    : course.hasMandatoryExam === false
                      ? 'This course can be completed without a mandatory exam'
                      : 'Exam requirements have not been specified for this course'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Assessment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course Assessment</DialogTitle>
            <DialogDescription>
              Define the assessment methods, grading criteria, and exam
              requirements for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Assessment Text */}
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment Details</Label>
              <MarkdownTextarea
                id="assessment"
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Enter assessment details using Markdown (e.g., grading breakdown, assignment types, evaluation criteria)..."
                className="min-h-32"
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {assessment.length}/2000 characters
              </div>
            </div>

            {/* Mandatory Exam Checkbox */}
            <div className="space-y-2">
              <Label>Exam Requirements</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mandatory-exam"
                  checked={hasMandatoryExam}
                  onCheckedChange={(checked) =>
                    setHasMandatoryExam(checked === true)
                  }
                />
                <Label htmlFor="mandatory-exam" className="text-sm">
                  This course has a mandatory exam
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Check this if students are required to take an exam to complete
                the course
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
