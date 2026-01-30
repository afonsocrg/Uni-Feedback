import {
  Button,
  EditableStarRating,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  WorkloadRatingSelect
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
