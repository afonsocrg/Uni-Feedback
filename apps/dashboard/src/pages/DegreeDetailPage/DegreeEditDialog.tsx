import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdminDegreeTypes, updateDegree, type AdminDegreeDetail } from '@uni-feedback/api-client'
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
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const degreeEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  acronym: z.string().min(1, 'Acronym is required'),
  type: z.string().min(1, 'Type is required')
})

type DegreeEditFormData = z.infer<typeof degreeEditSchema>

interface DegreeEditDialogProps {
  degree: AdminDegreeDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DegreeEditDialog({
  degree,
  open,
  onOpenChange
}: DegreeEditDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<DegreeEditFormData>({
    resolver: zodResolver(degreeEditSchema),
    defaultValues: {
      name: '',
      acronym: '',
      type: ''
    }
  })

  // Fetch degree types for the faculty
  const { data: degreeTypesResponse } = useQuery({
    queryKey: ['degree-types', degree?.facultyId],
    queryFn: () => getAdminDegreeTypes(degree?.facultyId),
    enabled: !!degree?.facultyId && open
  })

  const updateMutation = useMutation({
    mutationFn: (data: DegreeEditFormData) => {
      if (!degree) throw new Error('No degree selected')

      return updateDegree(degree.id, {
        name: data.name,
        acronym: data.acronym,
        type: data.type
      })
    },
    onSuccess: () => {
      if (degree) {
        queryClient.invalidateQueries({
          queryKey: ['degree-details', degree.id]
        })
        queryClient.invalidateQueries({ queryKey: ['admin-degrees'] })
      }
      toast.success('Degree updated successfully')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update degree'
      )
    }
  })

  // Update form when degree changes
  useEffect(() => {
    if (degree && open) {
      form.reset({
        name: degree.name,
        acronym: degree.acronym,
        type: degree.type
      })
    }
  }, [degree, open, form])

  const onSubmit = (data: DegreeEditFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!degree) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Degree</DialogTitle>
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
                    <Input {...field} placeholder="Degree name" />
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
                    <Input {...field} placeholder="Degree acronym" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select degree type" />
                      </SelectTrigger>
                      <SelectContent>
                        {degreeTypesResponse?.types?.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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