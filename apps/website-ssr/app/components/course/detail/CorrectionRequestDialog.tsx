import { zodResolver } from '@hookform/resolvers/zod'
import {
  CORRECTION_REQUEST_FIELD_LABELS,
  CORRECTION_REQUEST_FIELDS,
  submitCorrectionRequest,
  type CorrectionRequestField
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
import { Loader2, PenLine } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthenticatedButton } from '~/components'

const correctionFormSchema = z.object({
  field: z.enum(CORRECTION_REQUEST_FIELDS),
  notes: z.string().min(1, 'Please describe what is incorrect')
})

type CorrectionFormData = z.infer<typeof correctionFormSchema>

interface CorrectionRequestDialogProps {
  courseId: number
  courseName: string
  getCurrentValue: (field: CorrectionRequestField) => string | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CorrectionRequestDialog({
  courseId,
  courseName,
  getCurrentValue,
  open,
  onOpenChange
}: CorrectionRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<CorrectionFormData>({
    resolver: zodResolver(correctionFormSchema),
    defaultValues: {
      field: undefined,
      notes: ''
    }
  })

  const handleSubmit = async (data: CorrectionFormData) => {
    setIsSubmitting(true)
    try {
      await submitCorrectionRequest(courseId, {
        field: data.field,
        notes: data.notes,
        currentValue: getCurrentValue(data.field)
      })
      setIsSuccess(true)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit correction request'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
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
            <PenLine className="size-5 text-primaryBlue" />
            Report Incorrect Info
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
                Thank you!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your correction request has been submitted. We&apos;ll review it
                and update the information if needed.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Found incorrect information in{' '}
              <span className="font-medium text-gray-700">{courseName}</span>?
              Let us know and we&apos;ll review it.
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="field"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What&apos;s incorrect?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(
                            Object.entries(CORRECTION_REQUEST_FIELD_LABELS) as [
                              CorrectionRequestField,
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What should it be?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what's wrong and what the correct value should be..."
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
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit'
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
