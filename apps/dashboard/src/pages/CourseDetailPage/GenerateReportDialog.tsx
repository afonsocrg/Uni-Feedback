import { generateCourseReport } from '@uni-feedback/api-client'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface GenerateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
  courseName: string
}

const LOADING_MESSAGES = [
  'Reading student comments...',
  'Analyzing feedback patterns...',
  'AI is synthesizing insights...',
  'Generating statistical summaries...',
  'Creating visualizations...',
  'Polishing the PDF design...',
  'Finalizing the report...'
]

export function GenerateReportDialog({
  open,
  onOpenChange,
  courseId,
  courseName
}: GenerateReportDialogProps) {
  const currentYear = getCurrentSchoolYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  // Generate the last 5 school years
  const schoolYears = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) {
      setCurrentMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prev) => (prev + 1) % LOADING_MESSAGES.length
      )
    }, 4500) // Change message every 4.5 seconds

    return () => clearInterval(interval)
  }, [isGenerating])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setCurrentMessageIndex(0)

    try {
      const presignedUrl = await generateCourseReport(
        courseId,
        parseInt(selectedYear)
      )

      // Open the presigned URL in a new tab
      window.open(presignedUrl, '_blank', 'noopener,noreferrer')

      toast.success('Report generated successfully')

      // Close the dialog after a short delay
      setTimeout(() => {
        setIsGenerating(false)
        onOpenChange(false)
      }, 500)
    } catch (error) {
      setIsGenerating(false)
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate report'
      )
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isGenerating) {
      if (!isOpen) {
        setSelectedYear(currentYear.toString())
        setIsGenerating(false)
      }
      onOpenChange(isOpen)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Course Report
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF report for {courseName} including
            AI-powered analysis of student feedback.
          </DialogDescription>
        </DialogHeader>

        {!isGenerating ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="school-year">School Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="school-year">
                    <SelectValue placeholder="Select a school year..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}/{year + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={!selectedYear}>
                Generate Report
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {LOADING_MESSAGES[currentMessageIndex]}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
