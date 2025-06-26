import { Chip, SelectionCard, StarRating } from '@components'
import { Course } from '@services/meicFeedbackAPI'
import { Button } from '@ui'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface CourseCardProps extends Omit<Course, 'id'> {
  courseId: number
  useAcronymAsTitle?: boolean
}

export function CourseCard({
  courseId,
  acronym,
  name,
  rating,
  feedbackCount,
  terms,
  useAcronymAsTitle = false
}: CourseCardProps) {
  const navigate = useNavigate()

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300 }
    }
  }

  const title = useAcronymAsTitle ? acronym : name
  const subtitle = useAcronymAsTitle ? name : acronym

  const handleClick = () => {
    navigate(`/courses/${courseId}`)
  }

  return (
    <motion.div key={courseId} variants={itemVariants}>
      <SelectionCard
        title={title}
        subtitle={subtitle}
        onClick={handleClick}
        className="flex flex-col"
      >
        <div className="flex flex-col h-full flex-end">
          <div className="flex flex-col gap-3 mt-auto">
            {terms && terms.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {terms.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </div>
            )}

            {/* Rating or Call to Action */}
            <div className="flex items-center">
              {feedbackCount > 0 ? (
                <div className="flex items-center">
                  <div className="mr-2">
                    <StarRating value={rating} size="sm" />
                  </div>
                  <span className="text-gray-700">{rating.toFixed(1)}</span>
                  <span className="text-gray-500 ml-2">
                    ({feedbackCount} reviews)
                  </span>
                </div>
              ) : (
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(`/feedback/new?courseId=${courseId}`, '_blank')
                  }}
                  variant="link"
                  className="p-0 h-auto"
                >
                  Give the first review!
                </Button>
              )}
            </div>
          </div>
        </div>
      </SelectionCard>
    </motion.div>
  )
}
