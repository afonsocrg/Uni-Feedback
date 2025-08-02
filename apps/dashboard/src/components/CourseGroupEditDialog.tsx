import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createCourseGroup,
  updateCourseGroup,
  type AdminCourseGroup
} from '@uni-feedback/api-client'
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

const courseGroupSchema = z.object({
  name: z.string().min(1, 'Course group name is required')
})

type CourseGroupFormData = z.infer<typeof courseGroupSchema>

interface CourseGroupEditDialogProps {
  courseGroup?: AdminCourseGroup | null
  degreeId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseGroupEditDialog({
  courseGroup,
  degreeId,
  open,
  onOpenChange
}: CourseGroupEditDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = !!courseGroup

  const form = useForm<CourseGroupFormData>({
    resolver: zodResolver(courseGroupSchema),
    defaultValues: {
      name: ''
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: CourseGroupFormData) =>
      createCourseGroup({
        name: data.name,
        degreeId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-course-groups']
      })
      toast.success('Course group created successfully')
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create course group'
      )
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: CourseGroupFormData) => {
      if (!courseGroup) throw new Error('No course group selected')
      return updateCourseGroup(courseGroup.id, { name: data.name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-course-groups']
      })
      toast.success('Course group updated successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course group'
      )
    }
  })

  // Update form when courseGroup changes
  useEffect(() => {
    if (open) {
      if (courseGroup) {
        form.reset({
          name: courseGroup.name
        })
      } else {
        form.reset({
          name: ''
        })
      }
    }
  }, [courseGroup, open, form])

  const onSubmit = (data: CourseGroupFormData) => {
    if (isEditing) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Course Group' : 'Create Course Group'}
          </DialogTitle>
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
                    <Input {...field} placeholder="Course group name" />
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
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditing
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Group'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
