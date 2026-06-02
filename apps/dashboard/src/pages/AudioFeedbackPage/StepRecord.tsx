import { Button } from '@uni-feedback/ui'
import { Mic, MicOff, Pause, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAX_DURATION_SECONDS = 300 // 5 minutes

type RecordingState = 'idle' | 'recording' | 'paused'

interface StepRecordProps {
  onRecorded: (blob: Blob, url: string) => void
  onBack: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function StepRecord({ onRecorded, onBack }: StepRecordProps) {
  const [state, setState] = useState<RecordingState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      stopTimer()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (state === 'recording' && elapsed >= MAX_DURATION_SECONDS) {
      stopRecording()
    }
  }, [elapsed, state])

  function startTimer() {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function startRecording() {
    setPermissionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        onRecorded(blob, url)
      }

      recorder.start(250)
      mediaRecorderRef.current = recorder
      setState('recording')
      startTimer()
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone permissions and try again.'
          : 'Could not access microphone. Please check your device settings.'
      setPermissionError(msg)
    }
  }

  function pauseRecording() {
    mediaRecorderRef.current?.pause()
    stopTimer()
    setState('paused')
  }

  function resumeRecording() {
    mediaRecorderRef.current?.resume()
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    setState('recording')
  }

  function stopRecording() {
    stopTimer()
    mediaRecorderRef.current?.stop()
    setState('idle')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Record</h2>
        <p className="text-sm text-muted-foreground">
          Hand the device to the student and tap Record.
        </p>
      </div>

      {permissionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <MicOff className="h-4 w-4 mt-0.5 shrink-0" />
          {permissionError}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 py-4">
        {/* Big record button */}
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="w-28 h-28 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center shadow-lg cursor-pointer"
            aria-label="Start recording"
          >
            <Mic className="h-12 w-12 text-white" />
          </button>
        )}

        {(state === 'recording' || state === 'paused') && (
          <>
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center shadow-lg ${
                state === 'recording'
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-red-300'
              }`}
            >
              <Mic className="h-12 w-12 text-white" />
            </div>

            <div
              className={`text-3xl font-mono font-semibold tabular-nums ${
                elapsed >= MAX_DURATION_SECONDS - 30 ? 'text-destructive' : ''
              }`}
            >
              {formatDuration(elapsed)}
              <span className="text-base font-normal text-muted-foreground ml-1">
                / {formatDuration(MAX_DURATION_SECONDS)}
              </span>
            </div>

            {elapsed >= MAX_DURATION_SECONDS - 30 && (
              <p className="text-sm text-destructive">
                {MAX_DURATION_SECONDS - elapsed > 0
                  ? `Recording stops in ${MAX_DURATION_SECONDS - elapsed}s`
                  : 'Max duration reached — saving recording…'}
              </p>
            )}

            <div className="flex gap-3">
              {state === 'recording' ? (
                <Button variant="outline" size="lg" onClick={pauseRecording}>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="lg" onClick={resumeRecording}>
                  <Mic className="mr-2 h-5 w-5" />
                  Resume
                </Button>
              )}
              <Button variant="destructive" size="lg" onClick={stopRecording}>
                <Square className="mr-2 h-5 w-5" />
                Stop
              </Button>
            </div>
          </>
        )}

        {state === 'idle' && !permissionError && (
          <p className="text-sm text-muted-foreground">
            Tap to start recording
          </p>
        )}
      </div>

      <Button variant="ghost" className="w-full" onClick={onBack}>
        Back
      </Button>
    </div>
  )
}
