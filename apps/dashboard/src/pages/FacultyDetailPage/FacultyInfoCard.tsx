import { AddSuffixDialog, EditableField, FacultyEditDialog } from '@components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FacultyDetails,
  removeFacultyEmailSuffix,
  updateFaculty
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { Edit3, HelpCircle, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface FacultyInfoCardProps {
  faculty: FacultyDetails
}
export function FacultyInfoCard({ faculty }: FacultyInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddSuffixDialogOpen, setIsAddSuffixDialogOpen] = useState(false)
  const [isRemoveSuffixDialogOpen, setIsRemoveSuffixDialogOpen] =
    useState(false)
  const [suffixToRemove, setSuffixToRemove] = useState<string>('')

  const facultyId = id ? parseInt(id, 10) : 0

  const updateMutation = useMutation({
    mutationFn: (updates: { name?: string; shortName?: string }) =>
      updateFaculty(facultyId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-details', facultyId]
      })
      queryClient.invalidateQueries({ queryKey: ['faculties'] })
      setEditingField(null)
      setEditValues({})
      toast.success('Faculty updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update faculty'
      )
    }
  })

  const removeSuffixMutation = useMutation({
    mutationFn: (suffix: string) => removeFacultyEmailSuffix(facultyId, suffix),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-details', facultyId]
      })
      queryClient.invalidateQueries({ queryKey: ['faculties'] })
      setIsRemoveSuffixDialogOpen(false)
      setSuffixToRemove('')
      toast.success('Email suffix removed successfully')
    },
    onError: (error) => {
      setIsRemoveSuffixDialogOpen(false)
      setSuffixToRemove('')
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove email suffix'
      )
    }
  })

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditValues({ [field]: currentValue })
  }

  const handleSave = (field: string) => {
    const value = editValues[field]
    if (value !== undefined) {
      updateMutation.mutate({ [field]: value })
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValues({})
  }

  const handleRemoveSuffix = (suffix: string) => {
    setSuffixToRemove(suffix)
    setIsRemoveSuffixDialogOpen(true)
  }

  const confirmRemoveSuffixAction = () => {
    if (suffixToRemove) {
      removeSuffixMutation.mutate(suffixToRemove)
    }
  }

  const handleEditValueChange = (field: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Find which field is being edited
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
            Faculty Information
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
              >
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
              value={faculty.name}
              isEditing={editingField === 'name'}
              editValue={editValues['name'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />
            <EditableField
              field="shortName"
              label="Short Name"
              value={faculty.shortName}
              isEditing={editingField === 'shortName'}
              editValue={editValues['shortName'] || ''}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onChange={handleEditValueChange}
              onKeyDown={handleKeyDown}
              disabled={updateMutation.isPending}
            />

            {/* Email Suffixes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <dt className="font-medium text-sm">Email Suffixes</dt>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Email suffixes of students at this university (used to
                        validate emails when submitting feedback)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <dd className="flex flex-wrap gap-2">
                {faculty.emailSuffixes && faculty.emailSuffixes.length > 0
                  ? faculty.emailSuffixes.map((suffix, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="font-mono group hover:bg-destructive/10 transition-colors"
                      >
                        @{suffix}
                        <button
                          onClick={() => handleRemoveSuffix(suffix)}
                          className="ml-2 hover:text-destructive transition-colors"
                          disabled={removeSuffixMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  : null}

                {/* Add Suffix Badge */}
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-accent/50 transition-colors border-dashed"
                  onClick={() => setIsAddSuffixDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add suffix
                </Badge>
              </dd>

              {(!faculty.emailSuffixes ||
                faculty.emailSuffixes.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  No email suffixes configured. Click "Add suffix" to add one.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <FacultyEditDialog
        faculty={faculty}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      {/* Add Suffix Dialog */}
      <AddSuffixDialog
        facultyId={facultyId}
        open={isAddSuffixDialogOpen}
        onOpenChange={setIsAddSuffixDialogOpen}
      />

      {/* Remove Suffix Confirmation Dialog */}
      <Dialog
        open={isRemoveSuffixDialogOpen}
        onOpenChange={setIsRemoveSuffixDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Email Suffix</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the email suffix "@
              {suffixToRemove}"? Students with this email suffix will no longer
              be able to submit feedback to courses of this university.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveSuffixDialogOpen(false)}
              disabled={removeSuffixMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveSuffixAction}
              disabled={removeSuffixMutation.isPending}
            >
              {removeSuffixMutation.isPending ? 'Removing...' : 'Remove Suffix'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
