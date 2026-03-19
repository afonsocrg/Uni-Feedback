import {
  Button,
  EditableStarRating,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import {
  formatSchoolYearString,
  getCurrentSchoolYear
} from '@uni-feedback/utils'
import { Loader2, Send } from 'lucide-react'
import { useMemo } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router'
import { CommentSection } from '~/components'
import { AuthenticatedButton } from '~/components/common'
import type { FeedbackFormData } from '~/routes/feedback.new'
import { cn } from '~/utils/tailwind'

interface CourseWithDetails {
  id: number
  name: string
  acronym: string
  degree: {
    id: number
    name: string
    acronym: string
    faculty: {
      id: number
      name: string
      shortName: string
      emailSuffixes?: string[]
    }
  }
}

interface CourseSpecificFeedbackFormProps {
  course: CourseWithDetails
  form: UseFormReturn<FeedbackFormData>
  onSubmit: (values: FeedbackFormData) => Promise<void>
  isSubmitting: boolean
}

export function CourseSpecificFeedbackForm({
  course,
  form,
  onSubmit,
  isSubmitting
}: CourseSpecificFeedbackFormProps) {
  // Watch ratings for conditional comment display
  const rating = form.watch('rating')
  const workloadRating = form.watch('workloadRating')

  // Check if all required fields are filled
  const isFormValid = useMemo(() => {
    return rating > 0 && workloadRating > 0
  }, [rating, workloadRating])

  // Generate school years
  const schoolYears = useMemo(
    () => Array.from({ length: 5 }, (_, i) => getCurrentSchoolYear() - i),
    []
  )

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          Leave your Feedback!
        </h1>

        {/* Course Info Card */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{course.name}</h3>
              <p className="text-sm text-gray-600">{course.acronym}</p>
              <div className="flex gap-2 mt-2 text-xs text-gray-600">
                <span>{course.degree.acronym}</span>
                <span>·</span>
                <span>{course.degree.faculty.shortName}</span>
              </div>
            </div>
            <Link to="/feedback/new">
              <Button variant="ghost" size="sm">
                Change
              </Button>
            </Link>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* School Year - Subtle */}
            <FormField
              name="schoolYear"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-600">
                    When did you take this course?
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value.toString()}
                    >
                      <SelectTrigger className="w-[180px] bg-white">
                        <SelectValue placeholder="Select year" />
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

            {/* Ratings */}
            <div className="space-y-6">
              {/* Overall Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Overall Rating
                      {!field.value && <span className="text-red-500">*</span>}
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

              {/* Workload Rating */}
              <FormField
                control={form.control}
                name="workloadRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How was the workload?
                      {!field.value && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => field.onChange(Number(val))}
                        value={field.value?.toString() || ''}
                        className="flex flex-col gap-1.5"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center gap-2.5 py-1 cursor-pointer"
                          >
                            <RadioGroupItem
                              value={rating.toString()}
                              className="sr-only"
                            />
                            <div
                              className={cn(
                                'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                field.value === rating
                                  ? 'border-primaryBlue bg-primaryBlue'
                                  : 'border-gray-300'
                              )}
                            >
                              {field.value === rating && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <WorkloadRatingDisplay rating={rating} />
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Comment Section - Show after ratings filled */}
            {rating > 0 && workloadRating > 0 && (
              <div className="space-y-6">
                <CommentSection control={form.control} />
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6 mb-0 space-y-4">
              {/* Validation feedback */}
              {!isFormValid && (
                <div className="text-sm text-muted-foreground text-center">
                  Please fill in all required fields
                </div>
              )}

              <AuthenticatedButton
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isFormValid}
                authModalProps={{
                  allowedEmailSuffixes: course.degree.faculty.emailSuffixes,
                  universityName: course.degree.faculty.shortName,
                  successDescription: 'Submitting your feedback...'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Submit</span>
                  </>
                )}
              </AuthenticatedButton>
            </div>

            <p className="text-xs text-gray-500 text-center mt-1">
              By submitting this review, you agree to our{' '}
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primaryBlue hover:text-primaryBlue/80 underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primaryBlue hover:text-primaryBlue/80 underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </Form>
      </div>
    </main>
  )
}
