import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Chip,
  EditableStarRating,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  WorkloadRatingSelect
} from '@uni-feedback/ui'
import { formatSchoolYearString } from '@uni-feedback/utils'
import { Loader2, Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CommentSection } from './CommentSection'

interface EditFeedbackContentProps {
  feedback: {
    id: number
    rating: number
    workloadRating: number
    comment: string | null
    schoolYear: number
    courseName: string
    courseCode: string
    facultyShortName: string
    approvedAt: string | null
  }
  onSubmit: (values: EditFeedbackFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const editFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  workloadRating: z.number().min(1).max(5),
  comment: z.string().optional()
})

export type EditFeedbackFormData = z.infer<typeof editFeedbackSchema>

export function EditFeedbackContent({
  feedback,
  onSubmit,
  onCancel,
  isSubmitting
}: EditFeedbackContentProps) {
  const form = useForm({
    resolver: zodResolver(editFeedbackSchema),
    mode: 'onChange',
    defaultValues: {
      rating: feedback.rating,
      workloadRating: feedback.workloadRating,
      comment: feedback.comment || ''
    }
  })

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl min-h-screen pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Edit your feedback for {feedback.courseName}
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <Chip
            label={formatSchoolYearString(feedback.schoolYear, {
              yearFormat: 'long'
            })}
            color="blue"
          />
          <Chip label={feedback.courseCode} color="gray" />
          <Chip label={feedback.facultyShortName} color="gray" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[220px]">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Rating</FormLabel>
                      <FormControl>
                        <EditableStarRating
                          value={field.value}
                          onChange={field.onChange}
                          size="lg"
                          labelPosition="bottom"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="min-w-[220px]">
                <FormField
                  control={form.control}
                  name="workloadRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workload</FormLabel>
                      <FormControl>
                        <WorkloadRatingSelect
                          value={field.value}
                          onChange={(val) => field.onChange(val || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CommentSection control={form.control} />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="size-4" />
                <span>Cancel</span>
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  )
}
