import { database } from '@uni-feedback/db'
import {
  CTASection,
  FAQ,
  HeroSection,
  HowItWorksSection,
  LovedByStudentsSection,
  TestimonialsSection,
  TrustedSection
} from '../components/landing'

import type { Route } from './+types/landing'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Uni Feedback - Landing Page' },
    {
      name: 'description',
      content:
        'Honest, anonymous student feedback to help you find the right courses.'
    }
  ]
}

export async function loader() {
  const db = database()

  const studentClubs = await db.query.studentClubs.findMany({
    where: (clubs, { eq }) => eq(clubs.isActive, true),
    orderBy: (clubs) => [clubs.sortOrder]
  })

  const faculties = await db.query.faculties.findMany({
    orderBy: (faculties, { asc }) => [asc(faculties.id)]
  })

  // Fetch 6 most recent approved feedbacks with comments, including course and faculty info
  const recentFeedbacks = await db.query.feedback.findMany({
    where: (feedback, { and, isNotNull, ne }) =>
      and(
        isNotNull(feedback.approvedAt),
        isNotNull(feedback.comment),
        ne(feedback.comment, '')
      ),
    orderBy: (feedbacks, { desc }) => [desc(feedbacks.approvedAt)],
    limit: 6,
    with: {
      course: {
        with: {
          degree: {
            with: {
              faculty: true
            }
          }
        }
      }
    }
  })

  return { studentClubs, faculties, recentFeedbacks }
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <HeroSection
        studentClubs={loaderData.studentClubs}
        recentFeedbacks={loaderData.recentFeedbacks}
      />
      <HowItWorksSection />
      <TrustedSection />
      <LovedByStudentsSection faculties={loaderData.faculties} />
      <TestimonialsSection />
      <FAQ />
      <CTASection />
    </>
  )
}
