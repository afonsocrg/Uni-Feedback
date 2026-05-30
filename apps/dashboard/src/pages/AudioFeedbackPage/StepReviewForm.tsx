import type { AudioFeedbackProcessResult } from '@uni-feedback/api-client'
import {
  Button,
  EditableStarRating,
  EditableWorkloadRatingPills,
  Label,
  RichTextEditor
} from '@uni-feedback/ui'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FormValues {
  comment: string
  rating: number
  workloadRating: number
}

interface StepReviewFormProps {
  processResult: AudioFeedbackProcessResult
  onNext: (values: FormValues) => void
  onBack: () => void
}

export function StepReviewForm({
  processResult,
  onNext,
  onBack
}: StepReviewFormProps) {
  const [comment, setComment] = useState(processResult.comment ?? '')
  const [rating, setRating] = useState(processResult.rating ?? 3)
  const [workloadRating, setWorkloadRating] = useState(
    processResult.workloadRating ?? 3
  )
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  function handleNext() {
    onNext({ comment, rating, workloadRating })
  }

  const isValid =
    rating >= 1 && rating <= 5 && workloadRating >= 1 && workloadRating <= 5

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review & Edit</h2>
        <p className="text-sm text-muted-foreground">
          The student can edit any of these fields before submitting.
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <Label>Overall Rating</Label>
        <EditableStarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Workload rating */}
      <div className="space-y-2">
        <Label>Workload</Label>
        <EditableWorkloadRatingPills
          value={workloadRating}
          onChange={setWorkloadRating}
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label>Comment</Label>
        <RichTextEditor
          placeholder="What did you think about this course?"
          value={comment}
          onChange={setComment}
          minHeight="160px"
        />
      </div>

      {/* Transcript (collapsed) */}
      {processResult.transcript && (
        <div className="rounded-md border overflow-hidden">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
            onClick={() => setTranscriptOpen((o) => !o)}
          >
            <span>AI Transcript</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${transcriptOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {transcriptOpen && (
            <div className="px-4 py-3 text-sm text-muted-foreground border-t bg-muted/30 whitespace-pre-wrap">
              {processResult.transcript}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full"
          disabled={!isValid}
          onClick={handleNext}
        >
          Next
        </Button>
        <Button variant="ghost" className="w-full" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}
