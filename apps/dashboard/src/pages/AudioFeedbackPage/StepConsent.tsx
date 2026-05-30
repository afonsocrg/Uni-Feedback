import { useMutation } from '@tanstack/react-query'
import type { CourseSearchResult } from '@uni-feedback/api-client'
import { submitAudioFeedback } from '@uni-feedback/api-client'
import { Button, Checkbox, Input, Label } from '@uni-feedback/ui'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface FormValues {
  comment: string
  rating: number
  workloadRating: number
}

interface StepConsentProps {
  audioId: number
  course: CourseSearchResult
  schoolYear: number
  formValues: FormValues
  onSubmitted: (feedbackId: number) => void
  onBack: () => void
}

export function StepConsent({
  audioId,
  course,
  schoolYear,
  formValues,
  onSubmitted,
  onBack
}: StepConsentProps) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const canSubmit = emailValid && consent

  const mutation = useMutation({
    mutationFn: () =>
      submitAudioFeedback({
        audioId,
        courseId: course.id,
        schoolYear,
        rating: formValues.rating,
        workloadRating: formValues.workloadRating,
        comment: formValues.comment || undefined,
        email,
        consentGiven: true
      }),
    onSuccess: (data) => onSubmitted(data.feedbackId),
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Submission failed. Please try again.'
      )
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Email & Consent</h2>
        <p className="text-sm text-muted-foreground">
          Please enter the student's university email and confirm consent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">University Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="student@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex items-start gap-3 rounded-md border p-4">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="consent"
          className="text-sm leading-snug cursor-pointer"
        >
          I understand that my feedback will be made public on Uni Feedback and
          that my audio recording will be stored by Uni Feedback for quality
          assurance purposes.
        </label>
      </div>

      {mutation.isPending && (
        <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting…
        </div>
      )}

      {!mutation.isPending && (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            Submit Feedback
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
