import { type CourseSearchResult } from '@uni-feedback/api-client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { Loader2 } from 'lucide-react'
import { useFaculties } from '~/hooks/queries'
import { CourseBrowser } from './CourseBrowser'

interface ChangeCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCourseId: number
  onCourseSelect: (course: CourseSearchResult) => void
}

export function ChangeCourseDialog({
  open,
  onOpenChange,
  currentCourseId,
  onCourseSelect
}: ChangeCourseDialogProps) {
  const { data: faculties, isLoading } = useFaculties()

  const handleCourseSelect = (course: CourseSearchResult) => {
    // Don't do anything if user selects the same course
    if (course.id === currentCourseId) {
      onOpenChange(false)
      return
    }

    onCourseSelect(course)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-h-[80vh] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-3 pt-3 pb-2 md:px-6 md:pt-6 md:pb-4 shrink-0">
          <DialogTitle>Choose another course</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading || !faculties ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primaryBlue" />
            </div>
          ) : (
            <CourseBrowser
              faculties={faculties}
              onCourseSelectWithDetails={handleCourseSelect}
              compact
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
