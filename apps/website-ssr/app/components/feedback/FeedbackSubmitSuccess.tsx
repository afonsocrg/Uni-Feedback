import { Button, Card, CardContent, CardFooter } from '@uni-feedback/ui'

interface FeedbackSubmitSuccessProps {
  pointsEarned?: number
  onSubmitAnother: () => void
  browseLink: string
}

export function FeedbackSubmitSuccess({
  pointsEarned,
  onSubmitAnother,
  browseLink
}: FeedbackSubmitSuccessProps) {
  const hasPoints = pointsEarned !== undefined && pointsEarned > 0

  return (
    <main className="container mx-auto px-4 py-8 min-h-[90vh] flex items-center justify-center">
      <Card className="max-w-lg w-full shadow-lg">
        <CardContent className="text-center space-y-6 pt-8 px-2 md:px-8">
          {/* Heading */}
          <div className="space-y-2 px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-700 tracking-tight">
              Thank You!
            </h2>
            <p className="text-sm text-base text-gray-500">
              Your feedback will help hundreds of students finding the right
              courses!!
            </p>
          </div>

          {hasPoints && (
            <>
              {/* Points Earned - Prominent Display */}
              <div className="">
                <div className="text-sm text-gray-600">You got</div>
                <div className="text-xl font-bold text-primaryBlue">
                  +{pointsEarned} points
                </div>
              </div>

              {/* Encouragement Message */}
            </>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-2 pb-8">
          <Button onClick={onSubmitAnother} className="w-full">
            Submit Another Feedback
          </Button>
          <Button variant="outline" asChild className="w-full">
            <a href={browseLink}>Back to Courses</a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
