import { Button } from '@/components/ui'
import { getCoursePath } from '@/utils/routes'
import { Course } from '@services/meicFeedbackAPI'
import { motion } from 'framer-motion'
import { CheckCircle, Home, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ReviewSubmitSuccessProps {
  selectedCourse: Course | null
  onNewReview: () => void
  onBackToCourses: () => void
}

export function ReviewSubmitSuccess({
  selectedCourse,
  onNewReview,
  onBackToCourses
}: ReviewSubmitSuccessProps) {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        >
          <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
        </motion.div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Feedback Submitted!
        </h2>
        {selectedCourse !== null ? (
          <p className="text-gray-600 mb-8 text-lg">
            Thanks for your feedback on {selectedCourse.name}!! Your review is
            already available on the{' '}
            <Link
              to={getCoursePath(selectedCourse)}
              className="cursor-pointer underline text-primaryBlue hover:text-primaryBlue/80"
            >
              course page
            </Link>
            !
          </p>
        ) : (
          <p className="text-gray-600 mb-8 text-lg">
            Thanks for your feedback!! Your review is already available on the
            course page !
          </p>
        )}
        <div className="flex gap-4">
          <Button onClick={onNewReview}>
            <PlusCircle className="w-5 h-5" />
            Submit another review
          </Button>
          <Button variant="outline" onClick={onBackToCourses}>
            <Home className="w-5 h-5" />
            Back to all courses
          </Button>
        </div>
      </motion.div>
    </main>
  )
}
