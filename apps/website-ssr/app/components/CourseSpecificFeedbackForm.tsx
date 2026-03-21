import {
  Button,
  EditableStarRating,
  EditableWorkloadRating,
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
import { Loader2, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  // State for school year selector visibility
  const [showYearSelector, setShowYearSelector] = useState(false)

  // Watch ratings for conditional comment display
  const rating = form.watch('rating')
  const workloadRating = form.watch('workloadRating')
  const schoolYear = form.watch('schoolYear')

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
      <Form {...form}>
        <div>
          {/* Header - Course Context */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Leave your feedback
            </h1>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm">
                  {course.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {course.degree.faculty.shortName} · {course.degree.name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatSchoolYearString(schoolYear, {
                      yearFormat: 'long'
                    })}
                  </span>
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
                    className="text-xs text-primaryBlue hover:text-primaryBlue/80"
                  >
                    change
                  </button>
                </div>
              </div>
              <Link to="/feedback/new">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  Change
                </Button>
              </Link>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Main Feedback Section */}
            <div className="space-y-6">
              {/* Ratings Section */}
              <div className="flex flex-wrap gap-x-12 gap-y-6">
                {/* Overall Rating */}
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[250px]">
                      <FormLabel className="text-base font-medium text-gray-900">
                        How would you rate this course?
                      </FormLabel>
                      <FormControl>
                        <div className="pt-2">
                          <EditableStarRating
                            value={field.value}
                            onChange={field.onChange}
                            size="lg"
                          />
                        </div>
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
                    <FormItem className="flex-1 min-w-[250px]">
                      <FormLabel className="text-base font-medium text-gray-900">
                        How was the workload?
                      </FormLabel>
                      <FormControl>
                        <div className="pt-2">
                          <EditableWorkloadRating
                            value={field.value}
                            onChange={field.onChange}
                            size="lg"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comment Section - Always visible */}
              <div>
                <CommentSection control={form.control} />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <AuthenticatedButton
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isSubmitting || !isFormValid}
                authModalProps={{
                  allowedEmailSuffixes: course.degree.faculty.emailSuffixes,
                  universityName: course.degree.faculty.shortName,
                  successDescription: 'Submitting your feedback...'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-5" />
                    <span>Post Feedback</span>
                  </>
                )}
              </AuthenticatedButton>

              {!isFormValid && (
                <p className="text-sm text-gray-500 text-center mt-3">
                  Please select a star rating and workload level
                </p>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting, you agree to our{' '}
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
            </div>
          </form>
        </div>
      </Form>
    </main>
  )
}
