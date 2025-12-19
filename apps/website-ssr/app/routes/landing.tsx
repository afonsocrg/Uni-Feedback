import { database } from '@uni-feedback/db'
import { useSearchParams } from 'react-router'
import {
  ContactSection,
  CTASection,
  FAQ,
  HeroSection,
  HeroSectionV2,
  HeroSectionV3,
  HeroSectionV4,
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

  const testimonials = await db.query.testimonials.findMany({
    where: (testimonials, { eq }) => eq(testimonials.isActive, true),
    orderBy: (testimonials, { asc }) => [asc(testimonials.createdAt)]
  })

  // Fetch 6 most recent approved feedbacks with comments, including course and faculty info
  const recentFeedbacks = await db.query.feedback.findMany({
    where: (feedback, { and, isNotNull, ne }) =>
      and(
        isNotNull(feedback.approvedAt),
        isNotNull(feedback.comment),
        ne(feedback.comment, '')
      ),
    orderBy: (feedbacks, { desc }) => [desc(feedbacks.createdAt)],
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

  return { studentClubs, faculties, recentFeedbacks, testimonials }
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams()
  const heroVersion = searchParams.get('hero') || 'v2'

  const Hero =
    heroVersion === 'v1'
      ? HeroSection
      : heroVersion === 'v2'
        ? HeroSectionV2
        : heroVersion === 'v3'
          ? HeroSectionV3
          : heroVersion === 'v4'
            ? HeroSectionV4
            : HeroSectionV2

  return (
    <>
      <Hero
        studentClubs={loaderData.studentClubs}
        recentFeedbacks={loaderData.recentFeedbacks}
      />
      <HowItWorksSection />
      <TrustedSection />
      <LovedByStudentsSection faculties={loaderData.faculties} />
      <TestimonialsSection testimonials={loaderData.testimonials} />
      <FAQ />
      <ContactSection />
      <CTASection />
    </>
  )
}
