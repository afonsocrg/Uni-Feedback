import { type FeedbackRecommendation } from '@uni-feedback/api-client'
import {
  Button,
  Card,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@uni-feedback/ui'
import { getFeedbackPermalink } from '@uni-feedback/utils'
import { ChevronRight, HelpCircle } from 'lucide-react'
import { Link } from 'react-router'

interface FeedbackSubmitSuccessProps {
  pointsEarned?: number
  courseId?: number
  feedbackId?: number
  recommendations: FeedbackRecommendation[]
  isLoadingRecommendations?: boolean
  onSubmitAnother: () => void
}

export function SubmitFeedbackSuccess({
  pointsEarned,
  courseId,
  feedbackId,
  recommendations,
  isLoadingRecommendations = false,
  onSubmitAnother
}: FeedbackSubmitSuccessProps) {
  const hasPoints = pointsEarned !== undefined && pointsEarned > 0
  const feedbackUrl =
    courseId && feedbackId
      ? getFeedbackPermalink(courseId, feedbackId)
      : courseId
        ? `/courses/${courseId}`
        : undefined

  const hasRecommendations = recommendations.length > 0
  const hasReviewedAll = !hasRecommendations

  return (
    <main className="min-h-[90vh] flex items-center justify-center bg-[#FBFBFC]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Success Header - Clean, no background */}
          <div className="text-center space-y-6 py-4">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700">
                Legend move 😎!
              </h2>
            </div>

            <p className="text-base text-gray-500">
              Your feedback will help hundreds of students finding the right
              courses!!
            </p>

            {/* The Reward - Points Display */}
            {hasPoints && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-5xl md:text-6xl font-bold text-primaryBlue">
                  +{pointsEarned}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-medium text-gray-600">
                    point{pointsEarned != 1 ? 's' : ''}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/points"
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="text-white border-gray-900"
                      >
                        <p>How do points work?</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>

          {/* Recommendations Section */}
          {isLoadingRecommendations ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : hasRecommendations ? (
            <div className="space-y-4 mt-12">
              {/* The Bridge - CTA Header */}
              <p className="text-sm text-gray-500 text-center">
                Want to help more? Your peers would love your feedback on these:
              </p>

              {/* The Course List - Single white container */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-md overflow-hidden">
                {recommendations.map((course, index) => (
                  <div key={course.id}>
                    <a
                      href={`/courses/${course.id}/feedback?from=recommendations`}
                      className="block w-full px-4 py-3 hover:bg-gray-50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {course.acronym}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {course.name}
                          </div>
                        </div>
                        <ChevronRight className="size-5 text-gray-400 group-hover:text-primaryBlue flex-shrink-0 ml-2" />
                      </div>
                    </a>
                    {index < recommendations.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              {/* Subtle secondary action below */}
              <div className="text-center pt-1">
                <a
                  href="/feedback/new"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Give feedback to another course
                </a>
              </div>
            </div>
          ) : hasReviewedAll ? (
            <Card className="p-6 text-center space-y-3 bg-white border-gray-200">
              <div className="text-2xl">🏆</div>
              <h3 className="text-lg font-semibold text-gray-700">
                Mission Accomplished!
              </h3>
              <p className="text-sm text-gray-600">
                You've reviewed all available courses in your curriculum
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href="/browse">Browse all courses</a>
              </Button>
            </Card>
          ) : (
            <div className="text-center">
              <Button
                onClick={onSubmitAnother}
                variant="outline"
                className="w-full"
              >
                Submit for another course
              </Button>
            </div>
          )}

          {/* View your feedback link at the very bottom */}
          {feedbackUrl && (
            <div className="text-center pt-8">
              <a
                href={feedbackUrl}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                View your feedback →
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
