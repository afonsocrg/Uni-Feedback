import type { FeedbackCategories } from '@uni-feedback/api-client'
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
import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { FeedbackFormData } from '~/routes/feedback.new'
import { CommentSection } from './CommentSection'
import { FeedbackPointsProgress } from './FeedbackPointsProgress'

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
  const { t } = useTranslation('feedback')
  const [categories, setCategories] = useState<FeedbackCategories | null>(null)
  const courseId = form.watch('courseId')

  return (
    <div className="p-6 ">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {t('edit.update_title')}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-foreground">
                    {t('form.rating_label')}
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
                  <FormLabel className="text-base font-semibold text-foreground">
                    {t('form.workload_label')}
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

          <CommentSection
            control={form.control}
            onCategoriesChange={setCategories}
          />

          <FeedbackPointsProgress
            categories={categories}
            courseId={courseId}
            schoolYear={form.watch('schoolYear')}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="size-4" />
              <span>{t('edit.cancel')}</span>
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t('edit.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  <span>{t('edit.save')}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
