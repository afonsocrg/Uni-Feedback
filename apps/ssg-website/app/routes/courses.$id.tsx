import { cn } from '../utils'
import {
  CourseAssessment,
  CourseBibliography,
  CourseDescription,
  CourseDetailSkeleton,
  CourseInfoCard,
  CourseReviews
} from '../components'
import { useCourseDetails } from '../hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@uni-feedback/ui'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'

import type { Route } from "./+types/courses.$id";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300 }
  }
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Course ${params.id} - Uni Feedback` },
    { name: "description", content: `Reviews and details for course ${params.id}` },
  ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const courseId = parseInt(params.id, 10)
  
  // TODO: Fetch course data from database for SSG
  // This could pre-load course details for static generation
  
  return {
    courseId,
    // course: await getCourseById(courseId, context.db)
  };
}

export default function CourseDetail({ params, loaderData }: Route.ComponentProps) {
  const courseId = useMemo(() => parseInt(params.id, 10), [params.id])
  const { data: course, isLoading, error } = useCourseDetails(courseId)

  // Tab state and refs for scroll-to-section functionality
  const [selectedTab, setSelectedTab] = useState('overview')
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = {
    overview: useRef<HTMLDivElement>(null),
    reviews: useRef<HTMLDivElement>(null),
    assessment: useRef<HTMLDivElement>(null),
    bibliography: useRef<HTMLDivElement>(null)
  }

  // Scroll to section when tab changes
  useEffect(() => {
    if (selectedTab && tabRefs[selectedTab as keyof typeof tabRefs].current) {
      tabRefs[selectedTab as keyof typeof tabRefs].current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [selectedTab])

  // Intersection Observer for active tab highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const tabName = entry.target.getAttribute('data-tab')
            if (tabName) setSelectedTab(tabName)
          }
        })
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0.1
      }
    )

    Object.values(tabRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [course])

  if (isLoading) return <CourseDetailSkeleton />

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Course not found</h1>
        <p className="mt-4 text-gray-600">
          The course you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8" ref={containerRef}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <CourseInfoCard course={course} />
          </motion.div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm border-b">
              <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="bibliography">Bibliography</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-8 space-y-12">
              <TabsContent value="overview" className="mt-0">
                <motion.div
                  ref={tabRefs.overview}
                  data-tab="overview"
                  variants={itemVariants}
                  className={cn('space-y-6', selectedTab !== 'overview' && 'hidden')}
                >
                  <CourseDescription course={course} />
                </motion.div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <motion.div
                  ref={tabRefs.reviews}
                  data-tab="reviews"
                  variants={itemVariants}
                  className={cn('space-y-6', selectedTab !== 'reviews' && 'hidden')}
                >
                  <CourseReviews courseId={courseId} />
                </motion.div>
              </TabsContent>

              <TabsContent value="assessment" className="mt-0">
                <motion.div
                  ref={tabRefs.assessment}
                  data-tab="assessment"
                  variants={itemVariants}
                  className={cn('space-y-6', selectedTab !== 'assessment' && 'hidden')}
                >
                  <CourseAssessment course={course} />
                </motion.div>
              </TabsContent>

              <TabsContent value="bibliography" className="mt-0">
                <motion.div
                  ref={tabRefs.bibliography}
                  data-tab="bibliography"
                  variants={itemVariants}
                  className={cn('space-y-6', selectedTab !== 'bibliography' && 'hidden')}
                >
                  <CourseBibliography course={course} />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}