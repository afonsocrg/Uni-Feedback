import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addFacultyEmailSuffix } from '@uni-feedback/api-client'
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
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const addSuffixSchema = z.object({
  suffix: z
    .string()
    .min(1, 'Email suffix is required')
    .max(100, 'Email suffix is too long')
    .regex(/^[a-zA-Z0-9.-]+$/, 'Invalid email suffix format')
})

type AddSuffixFormData = z.infer<typeof addSuffixSchema>

interface AddSuffixDialogProps {
  facultyId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSuffixDialog({
  facultyId,
  open,
  onOpenChange
}: AddSuffixDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<AddSuffixFormData>({
    resolver: zodResolver(addSuffixSchema),
    defaultValues: {
      suffix: ''
    }
  })

  const addMutation = useMutation({
    mutationFn: (data: AddSuffixFormData) =>
      addFacultyEmailSuffix(facultyId, data.suffix),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['faculty-details', facultyId]
      })
      queryClient.invalidateQueries({ queryKey: ['faculties'] })
      toast.success('Email suffix added successfully')
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add email suffix'
      )
    }
  })

  const onSubmit = (data: AddSuffixFormData) => {
    addMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Email Suffix</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="suffix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Suffix</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="mr-1 text-muted-foreground">@</span>
                      <Input
                        {...field}
                        placeholder="example.edu"
                        className="flex-1"
                      />
                    </div>
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
                disabled={addMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add Suffix'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
