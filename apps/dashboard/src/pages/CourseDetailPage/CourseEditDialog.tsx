import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  updateCourse,
  type AdminCourseDetail
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

const courseEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  acronym: z.string().min(1, 'Acronym is required'),
  ects: z.string().optional()
})

type CourseEditFormData = z.infer<typeof courseEditSchema>

interface CourseEditDialogProps {
  course: AdminCourseDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseEditDialog({
  course,
  open,
  onOpenChange
}: CourseEditDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<CourseEditFormData>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      name: '',
      acronym: '',
      ects: ''
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: CourseEditFormData) => {
      if (!course) throw new Error('No course selected')

      return updateCourse(course.id, {
        name: data.name,
        acronym: data.acronym,
        ects: data.ects ? (data.ects === '' ? null : Number(data.ects)) : null
      })
    },
    onSuccess: () => {
      if (course) {
        queryClient.invalidateQueries({
          queryKey: ['course-details', course.id]
        })
        queryClient.invalidateQueries({ queryKey: ['courses'] })
      }
      toast.success('Course updated successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course'
      )
    }
  })

  // Update form when course changes
  useEffect(() => {
    if (course && open) {
      form.reset({
        name: course.name,
        acronym: course.acronym,
        ects: course.ects?.toString() || ''
      })
    }
  }, [course, open, form])

  const onSubmit = (data: CourseEditFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
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
                    <Input {...field} placeholder="Course name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acronym"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acronym</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Course acronym" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ECTS Credits</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="ECTS credits" 
                      min="0"
                      step="0.5"
                    />
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