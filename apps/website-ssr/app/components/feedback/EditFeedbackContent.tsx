import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  EditableStarRating,
  EditableWorkloadRatingPills,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Loader2, Pencil, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const form = useForm({
    resolver: zodResolver(editFeedbackSchema),
    mode: 'onChange',
    defaultValues: {
      rating: feedback.rating,
      workloadRating: feedback.workloadRating,
      comment: feedback.comment || '',
      schoolYear: feedback.schoolYear
    }
  })

  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  const [showYearSelector, setShowYearSelector] = useState(false)
  const schoolYear = form.watch('schoolYear')

  return (
    <main className="container mx-auto px-4 py-4 md:py-8 max-w-2xl min-h-screen pb-24">
      <Form {...form}>
        <div>
          {/* Header - Course Context */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="text-xs text-gray-400 mt-0.5">
              {feedback.facultyShortName} · {feedback.degreeName}
            </div>
            <div className="font-medium text-gray-900 text-[13px]">
              {feedback.courseName}
            </div>
            <div className="flex items-center gap-0.5 mt-1">
              <FormField
                name="schoolYear"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(Number(val))
                          setShowYearSelector(false)
                        }}
                        value={field.value.toString()}
                        open={showYearSelector}
                        onOpenChange={setShowYearSelector}
                      >
                        <SelectTrigger className="h-0 w-0 p-0 border-0 opacity-0 absolute">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schoolYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {formatSchoolYearString(year, {
                                yearFormat: 'long'
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button
                type="button"
                onClick={() => setShowYearSelector(true)}
                className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-primaryBlue cursor-pointer"
                aria-label="Change school year"
              >
                <span>
                  {formatSchoolYearString(schoolYear, {
                    yearFormat: 'long'
                  })}
                </span>
                <Pencil className="size-3" />
              </button>
            </div>
          </div>

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
                    <span>Save Changes</span>
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
