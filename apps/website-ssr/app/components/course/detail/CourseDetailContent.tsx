import type { Course } from '@uni-feedback/db/schema'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { useEffect, useRef, useState } from 'react'
import {
  Breadcrumb,
  CourseAssessment,
  CourseBibliography,
  CourseDescription,
  CourseInfoCard
} from '~/components'
import { cn } from '~/utils'
import { CourseReviews } from '.'

export interface CourseDetail extends Course {
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
  degree?: {
    id: number
    name: string
    acronym: string
    slug: string
  } | null
  faculty?: {
    id: number
    name: string
    shortName: string
    slug: string
  } | null
}

interface CourseDetailContentProps {
  course: CourseDetail
  feedback: Array<{
    id: number
    courseId: number
    email?: string | null
    schoolYear?: number | null
    rating: number
    workloadRating?: number | null
    comment?: string | null
    createdAt: Date | null
  }>
}

export function CourseDetailContent({
  course,
  feedback
}: CourseDetailContentProps) {
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

  const tabClasses = cn(
    'px-4 py-3 cursor-pointer relative',
    'font-medium text-gray-500 transition-all duration-200',
    'border-0 border-b-2 border-transparent rounded-none bg-transparent shadow-none',
    'hover:text-primaryBlue hover:bg-transparent',
    'data-[state=active]:text-bold data-[state=active]:text-primaryBlue data-[state=active]:border-b-primaryBlue data-[state=active]:bg-transparent data-[state=active]:shadow-none',
    'focus:outline-none transition-colors duration-400'
  )

  return (
    <main className="bg-gray-50/30 min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Breadcrumb
          faculty={course.faculty ?? undefined}
          degree={course.degree ?? undefined}
          course={course}
          className="mb-8"
        />

        <CourseInfoCard course={course} />

        <div className="mt-12">
          <Tabs defaultValue="feedback">
            <div className="relative">
              {/* Left gradient fade (opacity transitions) */}
              <div
                className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-gray-50/30 via-gray-50/20 to-transparent z-10 md:hidden transition-opacity duration-300"
                style={{ opacity: showLeftFade ? 1 : 0 }}
              />
              {/* Right gradient fade (opacity transitions) */}
              <div
                className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-gray-50/30 via-gray-50/20 to-transparent z-10 md:hidden transition-opacity duration-300"
                style={{ opacity: showRightFade ? 1 : 0 }}
              />
            </div>
            <div
              ref={tabsListRef}
              onScroll={handleScroll}
              className="overflow-x-auto scrollbar-none mb-8"
            >
              <TabsList className="inline-flex justify-start bg-transparent border-b-2 border-gray-200 rounded-none min-w-full gap-6 px-0">
                <TabsTrigger value="feedback" className={tabClasses}>
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="description" className={tabClasses}>
                  Description
                </TabsTrigger>
                <TabsTrigger value="assessment" className={tabClasses}>
                  Assessment
                </TabsTrigger>
                <TabsTrigger value="bibliography" className={tabClasses}>
                  Bibliography
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="description">
              <CourseDescription {...{ course }} />
            </TabsContent>
            <TabsContent value="assessment">
              <CourseAssessment {...{ course }} />
            </TabsContent>
            <TabsContent value="bibliography">
              <CourseBibliography {...{ course }} />
            </TabsContent>
            <TabsContent value="feedback">
              <CourseReviews course={course} feedback={feedback} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
