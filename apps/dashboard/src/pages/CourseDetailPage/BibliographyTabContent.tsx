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
  Markdown,
  MarkdownTextarea
} from '@uni-feedback/ui'
import { Edit3 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface BibliographyTabContentProps {
  course: AdminCourseDetail
}

export function BibliographyTabContent({ course }: BibliographyTabContentProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [bibliography, setBibliography] = useState(course.bibliography || '')

  const courseId = id ? parseInt(id, 10) : 0

  const updateMutation = useMutation({
    mutationFn: (updates: { bibliography: string | null }) =>
      updateCourse(courseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsEditDialogOpen(false)
      toast.success('Course bibliography updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update course bibliography'
      )
    }
  })

  const handleSave = () => {
    const trimmedBibliography = bibliography.trim()
    updateMutation.mutate({
      bibliography: trimmedBibliography || null
    })
  }

  const handleCancel = () => {
    setBibliography(course.bibliography || '')
    setIsEditDialogOpen(false)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Course Bibliography</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Bibliography
          </Button>
        </div>

        <div className="min-h-32 p-4 border rounded-md bg-muted/50">
          {course.bibliography ? (
            <div className="prose prose-sm max-w-none">
              <Markdown>{course.bibliography}</Markdown>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No bibliography available for this course.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Add Bibliography
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Bibliography Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course Bibliography</DialogTitle>
            <DialogDescription>
              List the required and recommended reading materials, textbooks,
              and other resources for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <MarkdownTextarea
              value={bibliography}
              onChange={(e) => setBibliography(e.target.value)}
              placeholder="Enter course bibliography using Markdown..."
              className="min-h-40"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {bibliography.length}/2000 characters
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
              {updateMutation.isPending ? 'Saving...' : 'Save Bibliography'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}