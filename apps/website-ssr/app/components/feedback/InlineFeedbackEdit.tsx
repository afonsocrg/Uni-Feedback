import {
  Button,
  EditableStarRating,
  EditableWorkloadRatingPills,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@uni-feedback/ui'
import { Loader2, Save, X } from 'lucide-react'
import { type UseFormReturn } from 'react-hook-form'
import type { FeedbackFormData } from '~/routes/feedback.new'
import { CommentSection } from './CommentSection'

export type EditFeedbackFormData = {
  rating: number
  workloadRating: number
  comment?: string
}

interface InlineFeedbackEditProps {
  form: UseFormReturn<FeedbackFormData>
  onSubmit: (values: EditFeedbackFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function InlineFeedbackEdit({
  form,
  onSubmit,
  onCancel,
  isSubmitting
}: InlineFeedbackEditProps) {
  return (
    <div className="p-6 ">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Update Your Feedback
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-gray-900">
                    How was the course?
                  </FormLabel>
                  <FormControl>
                    <EditableStarRating
                      value={field.value}
                      onChange={field.onChange}
                      size="lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workloadRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-gray-900">
                    How heavy was the workload?
                  </FormLabel>
                  <FormControl>
                    <EditableWorkloadRatingPills
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
