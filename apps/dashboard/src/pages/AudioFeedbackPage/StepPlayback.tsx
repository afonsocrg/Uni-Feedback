import { useMutation } from '@tanstack/react-query'
import type {
  AudioFeedbackProcessResult,
  CourseSearchResult
} from '@uni-feedback/api-client'
import { processAudioFeedback } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface StepPlaybackProps {
  audioBlob: Blob
  audioUrl: string
  course: CourseSearchResult
  onProcessed: (result: AudioFeedbackProcessResult) => void
  onReRecord: () => void
}

export function StepPlayback({
  audioBlob,
  audioUrl,
  course,
  onProcessed,
  onReRecord
}: StepPlaybackProps) {
  const mutation = useMutation({
    mutationFn: () => processAudioFeedback(audioBlob, course.id),
    onSuccess: (data) => onProcessed(data),
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to process audio. Please try again.'
      )
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review Recording</h2>
        <p className="text-sm text-muted-foreground">
          Listen back — if it sounds good, send it for AI processing.
        </p>
      </div>

      <audio controls src={audioUrl} className="w-full" />

      {mutation.isPending && (
        <div className="flex flex-col items-center gap-3 py-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Transcribing and extracting feedback…</p>
        </div>
      )}

      {!mutation.isPending && (
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => mutation.mutate()}
          >
            Use this recording
          </Button>
          <Button variant="outline" className="w-full" onClick={onReRecord}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Re-record
          </Button>
        </div>
      )}
    </div>
  )
}
