import { zodResolver } from '@hookform/resolvers/zod'
import {
  REPORT_CATEGORIES,
  REPORT_CATEGORY_LABELS,
  reportFeedback,
  type ReportCategory
} from '@uni-feedback/api-client'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '@uni-feedback/ui'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthenticatedButton, ReportFeedbackFeedbackCard } from '~/components'
import { analytics } from '~/utils/analytics'

const reportFormSchema = z.object({
  category: z.enum(REPORT_CATEGORIES),
  details: z.string().min(20, 'Please provide at least 20 characters of detail')
})

type ReportFormData = z.infer<typeof reportFormSchema>

interface ReportFeedbackDialogProps {
  feedback: {
    id: number
    courseId: number
    rating: number
    workloadRating: number | null
    comment: string | null
    createdAt: string
    isFromDifferentCourse: number
    degree: {
      id: number
      name: string
      acronym: string
    }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportFeedbackDialog({
  feedback,
  open,
  onOpenChange
}: ReportFeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      category: undefined,
      details: ''
    }
  })

  // Track when report dialog is opened
  useEffect(() => {
    if (open) {
      analytics.engagement.reportOpened({ feedbackId: feedback.id })
    }
  }, [open, feedback.id])

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true)
    try {
      await reportFeedback(feedback.id, {
        category: data.category as ReportCategory,
        details: data.details
      })

      // Track successful report submission
      analytics.engagement.reportSubmitted({
        feedbackId: feedback.id,
        reason: data.category
      })

      setIsSuccess(true)
      toast.success('Report submitted successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit report'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after dialog closes
    setTimeout(() => {
      setIsSuccess(false)
      form.reset()
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            Report Feedback
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Report Submitted
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Thank you for helping keep our community safe. Our moderators
                will review your report.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Report this feedback only if it breaks our{' '}
              <Link
                to="/guidelines"
                className="font-medium text-primary hover:underline"
              >
                guidelines
              </Link>
              .
              <br />
              If you just disagree with it, you can{' '}
              <Link
                to={`/feedback/new?courseId=${feedback.courseId}`}
                className="font-medium text-primary hover:underline"
              >
                share your own experience
              </Link>{' '}
              instead.
            </p>

            {/* Feedback preview */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                You are reporting:
              </p>
              <ReportFeedbackFeedbackCard feedback={feedback} />
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a reason for reporting" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(
                            Object.entries(REPORT_CATEGORY_LABELS) as [
                              ReportCategory,
                              string
                            ][]
                          ).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe why you're reporting this feedback..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <AuthenticatedButton
                    type="submit"
                    variant="outline"
                    disabled={isSubmitting}
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </AuthenticatedButton>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
