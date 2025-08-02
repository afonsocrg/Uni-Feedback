import {
  AddBadge,
  EditableBadge,
  EditableField
} from '@components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AdminCourseDetail,
  addCourseTerm,
  removeCourseTerm,
  updateCourse
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { Edit3, HelpCircle, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface CourseInfoCardProps {
  course: AdminCourseDetail
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string | number>>(
    {}
  )

  const [isAddTermDialogOpen, setIsAddTermDialogOpen] = useState(false)
  const [isRemoveTermDialogOpen, setIsRemoveTermDialogOpen] = useState(false)
  const [termToRemove, setTermToRemove] = useState<string>('')
  const [newTerm, setNewTerm] = useState('')

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
      setEditingField(null)
      setEditValues({})
      toast.success('Course updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course'
      )
    }
  })

  const addTermMutation = useMutation({
    mutationFn: (term: string) => addCourseTerm(courseId, term),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsAddTermDialogOpen(false)
      setNewTerm('')
      toast.success('Term added successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add term'
      )
    }
  })

  const removeTermMutation = useMutation({
    mutationFn: (term: string) => removeCourseTerm(courseId, term),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setIsRemoveTermDialogOpen(false)
      setTermToRemove('')
      toast.success('Term removed successfully')
    },
    onError: (error) => {
      setIsRemoveTermDialogOpen(false)
      setTermToRemove('')
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove term'
      )
    }
  })

  const handleEdit = (field: string, currentValue: string | number) => {
    setEditingField(field)
    setEditValues({ [field]: currentValue })
  }

  const handleSave = (field: string) => {
    const value = editValues[field]
    if (value !== undefined) {
      // Handle ECTS as number, others as string
      const updateData =
        field === 'ects'
          ? { [field]: value === '' ? null : Number(value) }
          : { [field]: value }
      updateMutation.mutate(updateData)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleRemoveTerm = (term: string) => {
    setTermToRemove(term)
    setIsRemoveTermDialogOpen(true)
  }

  const confirmRemoveTermAction = () => {
    if (termToRemove) {
      removeTermMutation.mutate(termToRemove)
    }
  }

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      addTermMutation.mutate(newTerm.trim())
    }
  }

  const handleEditValueChange = (field: string, value: string | number) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const editingFieldName = editingField
      if (editingFieldName) {
        handleSave(editingFieldName)
      }
    }
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Course Information
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit All
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <EditableField
              field="name"
              label="Name"
              value={course.name}
              isEditing={editingField === 'name'}
              editValue={editValues['name']?.toString() || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />

            <EditableField
              field="acronym"
              label="Acronym"
              value={course.acronym}
              isEditing={editingField === 'acronym'}
              editValue={editValues['acronym']?.toString() || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />

            <EditableField
              field="ects"
              label="ECTS"
              value={course.ects?.toString() || 'Not specified'}
              isEditing={editingField === 'ects'}
              editValue={editValues['ects']?.toString() || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
              type="number"
              placeholder="Enter ECTS credits"
            />

            {/* Degree Information (Read-only) */}
            <div className="space-y-2">
              <dt className="font-medium text-sm">Degree</dt>
              <dd className="text-sm text-muted-foreground">
                {course.degreeName} ({course.degreeAcronym}) -{' '}
                {course.facultyName}
              </dd>
            </div>

            {/* Feedback Count (Read-only) */}
            <div className="space-y-2">
              <dt className="font-medium text-sm flex items-center gap-2">
                Feedback
                <Badge variant="secondary" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {course.feedbackCount}
                </Badge>
              </dt>
            </div>

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
                        Academic terms when this course is available (e.g., Fall,
                        Spring, Summer)
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
                        disabled={
                          removeTermMutation.isPending ||
                          addTermMutation.isPending
                        }
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

      {/* Add Term Dialog */}
      <Dialog open={isAddTermDialogOpen} onOpenChange={setIsAddTermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Term</DialogTitle>
            <DialogDescription>
              Add a new academic term for this course (e.g., Fall, Spring,
              Summer).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-term">Term Name</Label>
              <Input
                id="new-term"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g., Fall 2024"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTerm()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTermDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTerm}
              disabled={!newTerm.trim() || addTermMutation.isPending}
            >
              {addTermMutation.isPending ? 'Adding...' : 'Add Term'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Term Confirmation Dialog */}
      <Dialog
        open={isRemoveTermDialogOpen}
        onOpenChange={setIsRemoveTermDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Term</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{termToRemove}" from this
              course's terms? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveTermDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveTermAction}
              disabled={removeTermMutation.isPending}
            >
              {removeTermMutation.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}