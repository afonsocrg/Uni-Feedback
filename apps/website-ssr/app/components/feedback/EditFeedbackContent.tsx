import { zodResolver } from '@hookform/resolvers/zod'
import type { FeedbackCategories } from '@uni-feedback/api-client'
import {
  Badge,
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
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Loader2, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { cn } from '~/utils'
import { CommentSection } from './CommentSection'
import { FeedbackPointsProgress } from './FeedbackPointsProgress'

interface EditFeedbackContentProps {
  feedback: {
    id: number
    courseId: number
    rating: number
    workloadRating: number
    comment: string | null
    schoolYear: number | null
    courseName: string
    courseCode: string
    degreeName: string
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
  comment: z.string().optional(),
  schoolYear: z.number().min(2000).max(2100)
})

export type EditFeedbackFormData = z.infer<typeof editFeedbackSchema>

export function EditFeedbackContent({
  feedback,
  onSubmit,
  onCancel,
  isSubmitting
}: EditFeedbackContentProps) {
  const { t } = useTranslation('feedback')
  const form = useForm({
    resolver: zodResolver(editFeedbackSchema),
    mode: 'onChange',
    defaultValues: {
      rating: feedback.rating,
      workloadRating: feedback.workloadRating,
      comment: feedback.comment || '',
      schoolYear: feedback.schoolYear ?? getCurrentSchoolYear()
    }
  })

  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  const [categories, setCategories] = useState<FeedbackCategories | null>(null)

  return (
    <main className="container mx-auto px-4 py-4 md:py-8 max-w-2xl min-h-screen pb-24">
      <Form {...form}>
        <div>
          {/* Header - Course Context */}
          <div className="mb-6 pb-4 border-b border-border">
            <div className="text-xs text-muted-foreground mt-0.5">
              {feedback.facultyShortName} · {feedback.degreeName}
            </div>
            <div className="font-medium text-foreground text-[13px]">
              {feedback.courseName}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="schoolYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-foreground">
                      {t('form.school_year_label')}
                    </FormLabel>
                    {/* <p className="text-sm text-muted-foreground">
                      {t('form.school_year_help')}
                    </p> */}
                    <FormControl>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {schoolYears.map((year) => {
                          const isSelected = field.value === year
                          return (
                            <button
                              key={year}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => field.onChange(year)}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant={isSelected ? 'default' : 'secondary'}
                                className={cn(
                                  'px-2.5 py-0.5 text-xs transition-colors',
                                  isSelected
                                    ? 'border-transparent bg-primaryBlue text-white hover:bg-primaryBlue/90'
                                    : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                              >
                                {formatSchoolYearString(year, {
                                  yearFormat: 'short'
                                })}
                              </Badge>
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              courseId={feedback.courseId}
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
                    <span>{t('edit.save_changes')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Form>
    </main>
  )
}
