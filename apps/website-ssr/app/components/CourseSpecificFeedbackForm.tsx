import { type CourseSearchResult } from '@uni-feedback/api-client'
import {
  EditableStarRating,
  // EditableWorkloadRatingBars,
  // EditableWorkloadRatingDropdown,
  // EditableWorkloadRatingList,
  EditableWorkloadRatingPills,
  // EditableWorkloadRatingScale,
  // EditableWorkloadRatingSegmented,
  // EditableWorkloadRatingSlider,
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
import { Loader2, Pencil, Send } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Link } from 'react-router'
import {
  ChangeCourseDialog,
  CommentSection,
  FeedbackDraftDialog
} from '~/components'
import { AuthenticatedButton } from '~/components/common'
import { useFeedbackDraft } from '~/hooks'
import type { FeedbackFormData } from '~/routes/feedback.new'
// import {
//   WorkloadInputDebugPanel,
//   type WorkloadInputType
// } from './WorkloadInputDebugPanel'

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
  // Workload input type state for debug panel (disabled for production)
  // const [workloadInputType, setWorkloadInputType] =
  //   useState<WorkloadInputType>('chips')

  // Draft management
  const { existingDraft, isLoaded, saveDraft, clearDraft } = useFeedbackDraft()
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [hasDismissedDraft, setHasDismissedDraft] = useState(false)
  const [enableAutoSave, setEnableAutoSave] = useState(false)

  // State for school year selector visibility
  const [showYearSelector, setShowYearSelector] = useState(false)

  // Local course state for changing course without navigation
  const [currentCourse, setCurrentCourse] = useState<CourseWithDetails>(course)
  const [showChangeCourseDialog, setShowChangeCourseDialog] = useState(false)

  // Handle course change from dialog
  const handleChangeCourse = useCallback(
    (selectedCourse: CourseSearchResult) => {
      // Transform CourseSearchResult to CourseWithDetails format
      const newCourse: CourseWithDetails = {
        id: selectedCourse.id,
        name: selectedCourse.name,
        acronym: selectedCourse.acronym,
        degree: {
          id: selectedCourse.degree.id,
          name: selectedCourse.degree.name,
          acronym: selectedCourse.degree.acronym,
          faculty: {
            id: selectedCourse.faculty.id,
            name: selectedCourse.faculty.name,
            shortName: selectedCourse.faculty.shortName
            // emailSuffixes not available from search - auth modal handles this gracefully
          }
        }
      }

      // Update local course state
      setCurrentCourse(newCourse)

      // Update form's courseId field
      form.setValue('courseId', newCourse.id)

      // Shallow URL update without triggering navigation/reload
      window.history.pushState(null, '', `/courses/${newCourse.id}/feedback`)
    },
    [form]
  )

  // Watch form values for draft saving (comment is handled separately to avoid re-renders)
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

  // Show draft recovery dialog on mount if draft exists AND form is empty
  // If form has content, just enable auto-save (user is working on new feedback)
  useEffect(() => {
    if (existingDraft && !hasDismissedDraft) {
      // Check if current form is empty
      const currentComment = form.getValues('comment') || ''
      const isFormEmpty =
        rating === 0 &&
        workloadRating === 0 &&
        currentComment.trim().length === 0

      if (isFormEmpty) {
        setShowDraftDialog(true)
      } else {
        // Form has content, enable auto-save without showing dialog
        setEnableAutoSave(true)
        setHasDismissedDraft(true)
      }
    } else if (!existingDraft) {
      setEnableAutoSave(true)
    }
  }, [existingDraft, hasDismissedDraft, rating, workloadRating, form])

  // Auto-save draft when rating/workload changes
  // Comment changes are handled separately by CommentSection to avoid re-renders
  useEffect(() => {
    if (enableAutoSave && (rating > 0 || workloadRating > 0)) {
      // Get current comment value without watching it
      const currentComment = form.getValues('comment') || ''
      saveDraft({
        rating,
        workloadRating,
        comment: currentComment
      })
    }
  }, [rating, workloadRating, saveDraft, enableAutoSave, form])

  // Callback for when comment changes (debounced in CommentSection)
  const handleCommentChange = useCallback(
    (comment: string) => {
      if (enableAutoSave) {
        saveDraft({
          rating: form.getValues('rating'),
          workloadRating: form.getValues('workloadRating'),
          comment
        })
      }
    },
    [enableAutoSave, saveDraft, form]
  )

  // Handle draft restoration
  const handleRestoreDraft = () => {
    if (existingDraft) {
      form.setValue('rating', existingDraft.rating)
      form.setValue('workloadRating', existingDraft.workloadRating)
      form.setValue('comment', existingDraft.comment)
    }
    setShowDraftDialog(false)
    setHasDismissedDraft(true)
    setEnableAutoSave(true) // Enable auto-save after restoring
  }

  // Handle draft discard
  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftDialog(false)
    setHasDismissedDraft(true)
    // Enable auto-save after discarding
    setEnableAutoSave(true)
  }

  // Wrap onSubmit to clear draft on successful submission
  const handleSubmit = async (values: FeedbackFormData) => {
    await onSubmit(values)
    // Clear draft only after successful submission
    clearDraft()
  }

  return (
    <main className="container mx-auto px-4 py-4 md:py-8 max-w-2xl min-h-screen">
      <Form {...form}>
        <div>
          {/* Header - Course Context */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <div className="text-xs text-gray-400 mt-0.5">
              {currentCourse.degree.faculty.shortName} ·{' '}
              {currentCourse.degree.name}
            </div>
            <div className="font-medium text-gray-900 text-[13px]">
              {currentCourse.name}
            </div>
            <div className="flex items-center justify-between gap-4 mt-1">
              <div className="flex items-center gap-0.5">
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
              <button
                type="button"
                onClick={() => setShowChangeCourseDialog(true)}
                className="text-xs text-primaryBlue hover:text-primaryBlue/80 whitespace-nowrap cursor-pointer"
              >
                Change course
              </button>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            {/* Main Feedback Section */}
            <div className="space-y-6">
              {/* Ratings Section */}
              <div className="flex flex-col gap-6">
                {/* Overall Rating */}
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        How was the course?
                        <span className="text-red-500">*</span>
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
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        How heavy was the workload?
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="pt-2">
                          <EditableWorkloadRatingPills
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {/* Other input types (disabled for production):
                          <EditableWorkloadRatingSegmented value={field.value} onChange={field.onChange} size="sm" />
                          <EditableWorkloadRatingDropdown value={field.value} onChange={field.onChange} size="sm" />
                          <EditableWorkloadRatingList value={field.value} onChange={field.onChange} />
                          <EditableWorkloadRatingBars value={field.value} onChange={field.onChange} />
                          <EditableWorkloadRatingSlider value={field.value} onChange={field.onChange} />
                          <EditableWorkloadRatingScale value={field.value} onChange={field.onChange} size="lg" />
                          */}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Comment Section - Always visible */}
              <div>
                <CommentSection
                  control={form.control}
                  onDebouncedChange={handleCommentChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <AuthenticatedButton
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isFormValid}
                authModalProps={{
                  allowedEmailSuffixes:
                    currentCourse.degree.faculty.emailSuffixes,
                  universityName: currentCourse.degree.faculty.shortName,
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
                    <span>Give Feedback</span>
                  </>
                )}
              </AuthenticatedButton>

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

      {/* Draft Recovery Dialog - only render after client-side load */}
      {isLoaded && existingDraft && (
        <FeedbackDraftDialog
          open={showDraftDialog}
          draftTimestamp={existingDraft.timestamp}
          rating={existingDraft.rating}
          workloadRating={existingDraft.workloadRating}
          comment={existingDraft.comment}
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      {/* Debug Panel - Disabled for production
      <WorkloadInputDebugPanel
        value={workloadInputType}
        onChange={setWorkloadInputType}
      />
      */}

      {/* Change Course Dialog */}
      <ChangeCourseDialog
        open={showChangeCourseDialog}
        onOpenChange={setShowChangeCourseDialog}
        currentCourseId={currentCourse.id}
        onCourseSelect={handleChangeCourse}
      />
    </main>
  )
}
