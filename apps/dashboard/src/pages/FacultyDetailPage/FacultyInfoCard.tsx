import {
  AddBadge,
  AddSuffixDialog,
  EditableBadge,
  EditableField,
  FacultyEditDialog,
  RemoveSuffixDialog
} from '@components'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FacultyDetails,
  removeFacultyEmailSuffix,
  updateFaculty
} from '@uni-feedback/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { Edit3, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

interface FacultyInfoCardProps {
  faculty: FacultyDetails
}
export function FacultyInfoCard({ faculty }: FacultyInfoCardProps) {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

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

  const handleRemoveSuffix = (suffix: string) => {
    setSuffixToRemove(suffix)
    setIsRemoveSuffixDialogOpen(true)
  }

  const confirmRemoveSuffixAction = () => {
    if (suffixToRemove) {
      removeSuffixMutation.mutate(suffixToRemove)
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
              label="Name"
              value={faculty.name}
              onSave={(newValue) => {
                updateMutation.mutate({ name: newValue })
              }}
              disabled={updateMutation.isPending}
            />
            <EditableField
              label="Short Name"
              value={faculty.shortName}
              onSave={(newValue) => {
                updateMutation.mutate({ shortName: newValue })
              }}
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
                      <EditableBadge
                        key={index}
                        value={suffix}
                        prefix="@"
                        onRemove={handleRemoveSuffix}
                        disabled={removeSuffixMutation.isPending}
                      />
                    ))
                  : null}

                <AddBadge
                  label="Add suffix"
                  onClick={() => setIsAddSuffixDialogOpen(true)}
                />
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

      {/* Remove Suffix Dialog */}
      <RemoveSuffixDialog
        open={isRemoveSuffixDialogOpen}
        onOpenChange={setIsRemoveSuffixDialogOpen}
        suffix={suffixToRemove}
        onConfirm={confirmRemoveSuffixAction}
        isLoading={removeSuffixMutation.isPending}
      />
    </>
  )
}
