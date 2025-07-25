import { cn } from '@/utils'
import {
  CourseAssessment,
  CourseDescription,
  CourseDetailSkeleton,
  CourseHeader,
  CourseReviews
} from '@components'
import { useCourseDetails } from '@hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300 }
  }
}

export function CourseDetail() {
  const { id } = useParams()

  const courseId = useMemo(() => parseInt(id!, 10), [id])
  const { data: course, isLoading, error } = useCourseDetails(courseId)

  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)
  const tabsListRef = useRef<HTMLDivElement>(null)

  const checkFades = () => {
    const el = tabsListRef.current
    if (!el) return
    setShowLeftFade(el.scrollLeft > 0)
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    checkFades()
    window.addEventListener('resize', checkFades)
    return () => window.removeEventListener('resize', checkFades)
  }, [])

  const handleScroll = () => {
    checkFades()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  if (isLoading) {
    return <CourseDetailSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center py-8">{error.message}</div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">Course not found</div>
      </div>
    )
  }

  const tabClasses = cn(
    'px-4 py-2 cursor-pointer',
    'font-medium',
    'rounded-none border-b-2 border-transparent',
    'data-[state=active]:border-b-primaryBlue data-[state=active]:text-primaryBlue',
    'data-[state=active]:bg-transparent data-[state=active]:shadow-none',
    'hover:text-primaryBlue'
  )

  return (
    <motion.main
      className="container mx-auto px-4 py-8 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <CourseHeader {...{ course }} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="reviews" className="w-full">
          <div className="relative">
            {/* Left gradient fade (opacity transitions) */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-gray-200 to-transparent z-10 md:hidden transition-opacity duration-300"
              style={{ opacity: showLeftFade ? 1 : 0 }}
            />
            {/* Right gradient fade (opacity transitions) */}
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-gray-200 to-transparent z-10 md:hidden transition-opacity duration-300"
              style={{ opacity: showRightFade ? 1 : 0 }}
            />
            <div
              ref={tabsListRef}
              onScroll={handleScroll}
              className="overflow-x-auto scrollbar-none"
            >
              <TabsList className="inline-flex justify-start bg-transparent border-b border-gray-200 w-full rounded-none min-w-max">
                <TabsTrigger value="description" className={tabClasses}>
                  What's this course about?
                </TabsTrigger>
                <TabsTrigger value="reviews" className={tabClasses}>
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="assessment" className={tabClasses}>
                  Assessment
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="description" className="mt-6">
            <CourseDescription {...{ course }} />
          </TabsContent>
          <TabsContent value="assessment" className="mt-6">
            <CourseAssessment {...{ course }} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <CourseReviews courseId={courseId} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.main>
  )
}
