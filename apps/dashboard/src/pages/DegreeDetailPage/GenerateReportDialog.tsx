import { AdminDegreeDetail, generateDegreeReport } from '@uni-feedback/api-client'
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
  degree: AdminDegreeDetail
}

const LOADING_MESSAGES = [
  'Gathering course feedback...',
  'Analyzing patterns across courses...',
  'AI is synthesizing insights...',
  'Building comparative index...',
  'Generating statistical summaries...',
  'Polishing the PDF design...',
  'Finalizing the report...'
]

export function GenerateReportDialog({
  open,
  onOpenChange,
  degree
}: GenerateReportDialogProps) {
  const currentYear = getCurrentSchoolYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [selectedCurriculumYear, setSelectedCurriculumYear] = useState<string>('all')
  const [selectedTerms, setSelectedTerms] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const schoolYears = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const reportOptions = degree.reportOptions

  // Rotate loading messages
  useEffect(() => {
    if (!isGenerating) {
      setCurrentMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [isGenerating])

  const handleTermToggle = (term: string) => {
    setSelectedTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    )
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setCurrentMessageIndex(0)

    try {
      const presignedUrl = await generateDegreeReport(
        degree.id,
        parseInt(selectedYear),
        selectedCurriculumYear !== 'all' ? parseInt(selectedCurriculumYear) : undefined,
        selectedTerms.length > 0 ? selectedTerms : undefined
      )

      window.open(presignedUrl, '_blank', 'noopener,noreferrer')
      toast.success('Report generated successfully')

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
        setSelectedCurriculumYear('all')
        setSelectedTerms([])
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
            Generate Semester Report
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF report for {degree.name} with
            AI-powered analysis across all courses.
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

              {reportOptions && reportOptions.curriculumYears.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="curriculum-year">
                    Curriculum Year{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Select
                    value={selectedCurriculumYear}
                    onValueChange={setSelectedCurriculumYear}
                  >
                    <SelectTrigger id="curriculum-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {reportOptions.curriculumYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportOptions && reportOptions.terms.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    Terms{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {reportOptions.terms.map((term) => (
                      <Button
                        key={term}
                        type="button"
                        size="sm"
                        variant={
                          selectedTerms.includes(term) ? 'default' : 'outline'
                        }
                        onClick={() => handleTermToggle(term)}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
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
