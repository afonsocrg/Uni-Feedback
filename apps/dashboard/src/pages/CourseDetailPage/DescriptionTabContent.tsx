import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCourseDetail, updateCourse } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea
} from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface DescriptionTabContentProps {
  course: AdminCourseDetail
}

export function DescriptionTabContent({ course }: DescriptionTabContentProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [description, setDescription] = useState(course.description || '')

  const courseId = id ? parseInt(id, 10) : 0

  const updateMutation = useMutation({
    mutationFn: (updates: { description: string | null }) =>
      updateCourse(courseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsEditDialogOpen(false)
      toast.success('Course description updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update course description'
      )
    }
  })

  const handleSave = () => {
    const trimmedDescription = description.trim()
    updateMutation.mutate({
      description: trimmedDescription || null
    })
  }

  const handleCancel = () => {
    setDescription(course.description || '')
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Course Description</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Description
          </Button>
        </div>

        <div className="min-h-32 p-4 border rounded-md bg-muted/50">
          {course.description ? (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {course.description}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No description available for this course.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Add Description
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Description Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course Description</DialogTitle>
            <DialogDescription>
              Provide a detailed description of the course content, objectives,
              and learning outcomes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter course description..."
              className="min-h-40 resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/2000 characters
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Description'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}