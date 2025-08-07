import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCourseTerm, getAllTerms } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { useState } from 'react'
import { toast } from 'sonner'

interface AddTermDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
  facultyId: number
  existingTerms: string[] | null
}

export function AddTermDialog({
  open,
  onOpenChange,
  courseId,
  facultyId,
  existingTerms
}: AddTermDialogProps) {
  const queryClient = useQueryClient()
  const [newTerm, setNewTerm] = useState('')

  // Fetch available terms for the faculty
  const { data: availableTerms } = useQuery({
    queryKey: ['course-terms', facultyId],
    queryFn: () => getAllTerms(facultyId)
  })

  const addTermMutation = useMutation({
    mutationFn: (term: string) => addCourseTerm(courseId, term),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['course-details', courseId]
      })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      onOpenChange(false)
      setNewTerm('')
      toast.success('Term added successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add term')
    }
  })

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      addTermMutation.mutate(newTerm.trim())
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setNewTerm('')
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Select value={newTerm} onValueChange={setNewTerm}>
              <SelectTrigger>
                <SelectValue placeholder="Select a term..." />
              </SelectTrigger>
              <SelectContent>
                {availableTerms?.terms
                  .filter((term) => !existingTerms?.includes(term))
                  .map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
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
  )
}