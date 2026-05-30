import type {
  AudioFeedbackProcessResult,
  CourseSearchResult
} from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { StepConsent } from './StepConsent'
import { StepCourseSelect } from './StepCourseSelect'
import { StepPlayback } from './StepPlayback'
import { StepRecord } from './StepRecord'
import { StepReviewForm } from './StepReviewForm'

type Step = 1 | 2 | 3 | 4 | 5

interface FormValues {
  comment: string
  rating: number
  workloadRating: number
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Course',
  2: 'Record',
  3: 'Playback',
  4: 'Review',
  5: 'Submit'
}

export function AudioFeedbackPage() {
  const [step, setStep] = useState<Step>(1)
  const [course, setCourse] = useState<CourseSearchResult | null>(null)
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear())
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [processResult, setProcessResult] =
    useState<AudioFeedbackProcessResult | null>(null)
  const [formValues, setFormValues] = useState<FormValues | null>(null)
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<number | null>(
    null
  )

  function reset() {
    setStep(1)
    setCourse(null)
    setSchoolYear(getCurrentSchoolYear())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setProcessResult(null)
    setFormValues(null)
    setSubmittedFeedbackId(null)
  }

  function handleRecorded(blob: Blob, url: string) {
    setAudioBlob(blob)
    setAudioUrl(url)
    setStep(3)
  }

  function handleProcessed(result: AudioFeedbackProcessResult) {
    setProcessResult(result)
    setStep(4)
  }

  function handleReviewNext(values: FormValues) {
    setFormValues(values)
    setStep(5)
  }

  function handleSubmitted(feedbackId: number) {
    setSubmittedFeedbackId(feedbackId)
  }

  if (submittedFeedbackId !== null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-6 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div>
          <h2 className="text-2xl font-semibold">Feedback Submitted!</h2>
          <p className="text-muted-foreground mt-1">
            Feedback #{submittedFeedbackId} is now live.
          </p>
        </div>
        <Button onClick={reset} size="lg">
          Collect Another
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">In-Person Audio Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record a student's spoken review and submit it on their behalf.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          </div>
        ))}
      </div>

      {step === 1 && (
        <StepCourseSelect
          selected={course}
          onSelect={setCourse}
          schoolYear={schoolYear}
          onSchoolYearChange={setSchoolYear}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepRecord onRecorded={handleRecorded} onBack={() => setStep(1)} />
      )}

      {step === 3 && audioBlob && audioUrl && course && (
        <StepPlayback
          audioBlob={audioBlob}
          audioUrl={audioUrl}
          course={course}
          onProcessed={handleProcessed}
          onReRecord={() => {
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            setAudioBlob(null)
            setAudioUrl(null)
            setStep(2)
          }}
        />
      )}

      {step === 4 && processResult && (
        <StepReviewForm
          processResult={processResult}
          onNext={handleReviewNext}
          onBack={() => setStep(3)}
        />
      )}

      {step === 5 && processResult && formValues && course && (
        <StepConsent
          audioId={processResult.audioId}
          course={course}
          schoolYear={schoolYear}
          formValues={formValues}
          onSubmitted={handleSubmitted}
          onBack={() => setStep(4)}
        />
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        Step {step} of 5 — {STEP_LABELS[step]}
      </p>
    </div>
  )
}
