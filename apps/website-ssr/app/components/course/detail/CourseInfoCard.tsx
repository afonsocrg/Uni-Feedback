import {
  Button,
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { ExternalLink, Share2, Star, Clock, FileCheck } from 'lucide-react'
import { useState } from 'react'

export interface CourseInfoCardProps {
  course: {
    id: number
    name: string
    acronym: string
    url?: string | null
    description?: string | null
    assessment?: string | null
    bibliography?: string | null
    terms?: string[] | null
    ects?: number | null
    hasMandatoryExam?: boolean | null
    averageRating: number
    averageWorkload: number
    totalFeedbackCount: number
    degree?: {
      id: number
      name: string
      acronym: string
      faculty?: {
        id: number
        name: string
        shortName: string
      }
    } | null
  }
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const [isShareOpen, setIsShareOpen] = useState(false)

  const handleCopyUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.toString())
      setIsShareOpen(false)
    }
  }

  const averageWorkload = Number(course.averageWorkload) || 0

  return (
    <div className="mb-12">
      {/* Hero Section */}
      <div className="space-y-3">
        {/* Top Row: Title and action buttons */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-primaryBlue leading-tight">
            {course.name}
          </h1>

          <div className="flex items-center gap-2 flex-shrink-0">
            {course.url && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  <span className="hidden sm:block">Course Page</span>
                </a>
              </Button>
            )}

            <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-500"
                >
                  <Share2 className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="flex flex-col gap-2">
                  {typeof window !== 'undefined' && navigator.clipboard && (
                    <Button variant="ghost" onClick={handleCopyUrl}>
                      Copy Link
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Badges under title */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">
            {course.acronym}
          </span>
          {course.ects && (
            <>
              <span className="text-gray-300">•</span>
              <Chip label={`${course.ects} ECTS`} size="sm" color="gray" />
            </>
          )}
          {course.terms && course.terms.length > 0 && (
            <>
              <span className="text-gray-300">•</span>
              {course.terms.map((term) => (
                <Chip key={term} label={term} color="gray" size="sm" />
              ))}
            </>
          )}
        </div>

        {/* Stats Grid - 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          {/* Feedback Stat */}
          <div className="flex items-center gap-2">
            <Star className="size-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Feedback
                </span>
                {course.totalFeedbackCount > 0 && (
                  <span className="text-xs text-gray-400">
                    ({course.totalFeedbackCount})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {course.totalFeedbackCount === 0 ? (
                  <span className="text-xs text-gray-500">No reviews yet</span>
                ) : (
                  <>
                    <StarRating
                      value={Number(course.averageRating) || 0}
                      showHalfStars
                      size="sm"
                    />
                    <span className="text-xs text-gray-400">
                      {(Number(course.averageRating) || 0).toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Workload Stat */}
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-gray-700">
                  Workload
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="17" r="0.5" fill="currentColor" strokeWidth="0"/>
                      </svg>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Workload Scale</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          <strong>1 = Very Heavy</strong> (most time commitment)
                        </div>
                        <div>
                          <strong>5 = Very Light</strong> (least time
                          commitment)
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {averageWorkload ? (
                  <>
                    <WorkloadRatingDisplay rating={averageWorkload} size="sm" />
                    <span className="text-xs text-gray-400">
                      {averageWorkload.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500">--</span>
                )}
              </div>
            </div>
          </div>

          {/* Exam Stat */}
          <div className="flex items-center gap-2">
            <FileCheck className="size-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 mb-0.5">
                <span className="text-sm font-medium text-gray-700">
                  Exam
                </span>
              </div>
              <div className="flex items-center gap-2">
                {course.hasMandatoryExam !== null ? (
                  course.hasMandatoryExam ? (
                    <Chip label="Mandatory" color="red" size="xs" />
                  ) : (
                    <Chip label="Not Mandatory" color="green" size="xs" />
                  )
                ) : (
                  <Chip label="Not specified" size="xs" color="gray" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
