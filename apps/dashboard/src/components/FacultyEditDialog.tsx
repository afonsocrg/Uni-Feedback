import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFaculty } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input
} from '@uni-feedback/ui'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const facultyEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  shortName: z.string().min(1, 'Short name is required')
})

type FacultyEditFormData = z.infer<typeof facultyEditSchema>

interface FacultyEditDialogProps {
  faculty: AdminFacultyDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FacultyEditDialog({
  faculty,
  open,
  onOpenChange
}: FacultyEditDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<FacultyEditFormData>({
    resolver: zodResolver(facultyEditSchema),
    defaultValues: {
      name: '',
      shortName: ''
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: FacultyEditFormData) => {
      if (!faculty) throw new Error('No faculty selected')

      return updateFaculty(faculty.id, {
        name: data.name,
        shortName: data.shortName
      })
    },
    onSuccess: () => {
      if (faculty) {
        queryClient.invalidateQueries({
          queryKey: ['faculty-details', faculty.id]
        })
        queryClient.invalidateQueries({ queryKey: ['faculties'] })
      }
      toast.success('Faculty updated successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update faculty'
      )
    }
  })

  // Update form when faculty changes
  useEffect(() => {
    if (faculty && open) {
      form.reset({
        name: faculty.name,
        shortName: faculty.shortName
      })
    }
  }, [faculty, open, form])

  const onSubmit = (data: FacultyEditFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!faculty) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Faculty</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Faculty name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Faculty short name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
