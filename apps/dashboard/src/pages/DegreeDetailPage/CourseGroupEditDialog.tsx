import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
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
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseGroupEditDialog({
  courseGroup,
  open,
  onOpenChange
}: CourseGroupEditDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<CourseGroupFormData>({
    resolver: zodResolver(courseGroupSchema),
    defaultValues: {
      name: ''
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
      form.reset({
        name: courseGroup?.name ?? ''
      })
    }
  }, [courseGroup, open, form])

  const onSubmit = (data: CourseGroupFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  const isLoading = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{'Edit Course Group'}</DialogTitle>
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
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
