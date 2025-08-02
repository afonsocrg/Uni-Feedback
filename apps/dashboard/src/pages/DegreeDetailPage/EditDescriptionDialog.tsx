import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminDegreeDetail, updateDegree } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  MarkdownTextarea
} from '@uni-feedback/ui'
import { useState } from 'react'
import { toast } from 'sonner'

interface DescriptionTabContentProps {
  degree: AdminDegreeDetail
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}
export function EditDescriptionDialog({
  degree,
  isOpen,
  setIsOpen
}: DescriptionTabContentProps) {
  const [descriptionValue, setDescriptionValue] = useState(
    degree.description ?? ''
  )

  const queryClient = useQueryClient()
  const updateMutation = useMutation({
    mutationFn: (updates: {
      name?: string
      acronym?: string
      type?: string
      description?: string | null
    }) => updateDegree(degree.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['degree-details', degree.id]
      })
      queryClient.invalidateQueries({ queryKey: ['admin-degrees'] })
      setIsOpen(false)
      toast.success('Degree updated successfully')
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update degree'
      )
    }
  })

  const handleSaveDescription = () => {
    updateMutation.mutate({ description: descriptionValue })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
          <DialogDescription>Update the degree description</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <MarkdownTextarea
            value={descriptionValue}
            onChange={(e) => setDescriptionValue(e.target.value)}
            placeholder="Enter degree description..."
            className="min-h-[200px]"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDescription}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
