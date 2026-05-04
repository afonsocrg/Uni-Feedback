import { database } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  BrowseSection,
  ContributeCTASection,
  ContributeStrip,
  CTASection,
  FounderSection,
  HeroSection,
  LandingFAQSection,
  LiveFeedSection,
  MoreThanYourNetworkSection,
  TestimonialsSection,
  TrustSection
} from '~/components'

import type { Route } from './+types/landing'

export function meta() {
  return [
    { title: 'Uni Feedback' },
    {
      name: 'description',
      content:
        'Honest, anonymous student feedback to help you find the right courses.'
    }
  ]
}

export async function loader() {
  const db = database()

  const [
    studentClubs,
    faculties,
    degrees,
    testimonials,
    recentFeedbacks,
    totalFeedbackResult,
    contributorResult,
    coursesWithFeedbackResult
  ] = await Promise.all([
    db.query.studentClubs.findMany({
      where: (clubs, { eq }) => eq(clubs.isActive, true),
      orderBy: (clubs) => [clubs.sortOrder]
    }),
    db.query.faculties.findMany({
      orderBy: (faculties, { asc }) => [asc(faculties.id)]
    }),
    db
      .select({
        id: schema.degrees.id,
        name: schema.degrees.name,
        acronym: schema.degrees.acronym,
        slug: schema.degrees.slug,
        facultyId: schema.degrees.facultyId,
        courseCount: sql<number>`coalesce(${schema.degreeStats.courseCount}, 0)`,
        feedbackCount: sql<number>`coalesce(${schema.degreeStats.feedbackCount}, 0)`,
        faculty: {
          id: schema.faculties.id,
          name: schema.faculties.name,
          shortName: schema.faculties.shortName,
          slug: schema.faculties.slug,
          logo: schema.faculties.logo
        }
      })
      .from(schema.degrees)
      .innerJoin(
        schema.faculties,
        eq(schema.faculties.id, schema.degrees.facultyId)
      )
      .leftJoin(
        schema.degreeStats,
        eq(schema.degreeStats.degreeId, schema.degrees.id)
      )
      .orderBy(
        desc(sql`coalesce(${schema.degreeStats.feedbackCount}, 0)`),
        desc(sql`coalesce(${schema.degreeStats.courseCount}, 0)`)
      ),
    db.query.testimonials.findMany({
      where: (testimonials, { eq }) => eq(testimonials.isActive, true),
      orderBy: (testimonials, { asc }) => [asc(testimonials.createdAt)]
    }),
    db.query.feedbackFull.findMany({
      where: (feedback, { and, isNotNull, isNull, ne }) =>
        and(
          isNull(feedback.deletedAt),
          isNotNull(feedback.approvedAt),
          isNotNull(feedback.comment),
          ne(feedback.comment, '')
        ),
      orderBy: (feedbacks, { desc }) => [desc(feedbacks.createdAt)],
      limit: 50,
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
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.feedbackFull)
      .where(
        and(
          isNull(schema.feedbackFull.deletedAt),
          isNotNull(schema.feedbackFull.approvedAt)
        )
      ),
    db
      .select({
        count: sql<number>`count(distinct ${schema.feedbackFull.userId})`
      })
      .from(schema.feedbackFull)
      .where(
        and(
          isNull(schema.feedbackFull.deletedAt),
          isNotNull(schema.feedbackFull.approvedAt)
        )
      ),
    db
      .select({
        count: sql<number>`count(distinct ${schema.feedbackFull.courseId})`
      })
      .from(schema.feedbackFull)
      .where(
        and(
          isNull(schema.feedbackFull.deletedAt),
          isNotNull(schema.feedbackFull.approvedAt)
        )
      )
  ])

  return {
    studentClubs,
    faculties,
    degrees,
    recentFeedbacks,
    testimonials,
    stats: {
      totalFeedback: roundDownToNice(Number(totalFeedbackResult[0].count)),
      contributors: roundDownToNice(Number(contributorResult[0].count)),
      coursesWithFeedback: roundDownToNice(
        Number(coursesWithFeedbackResult[0].count)
      )
    }
  }
}

function roundDownToNice(n: number): number {
  if (n >= 500) return Math.floor(n / 50) * 50
  if (n >= 100) return Math.floor(n / 10) * 10
  return Math.floor(n / 5) * 5
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const {
    studentClubs,
    faculties,
    degrees,
    recentFeedbacks,
    testimonials,
    stats
  } = loaderData

  return (
    <>
      <HeroSection
        studentClubs={studentClubs}
        recentFeedbacks={recentFeedbacks}
        stats={stats}
      />
      <ContributeStrip />
      <FounderSection />
      <LiveFeedSection feedbacks={recentFeedbacks} />
      <MoreThanYourNetworkSection />
      <TrustSection />
      <BrowseSection faculties={faculties} degrees={degrees} />
      <TestimonialsSection testimonials={testimonials} />
      <ContributeCTASection contributors={stats.contributors} />
      <LandingFAQSection />
      <CTASection />
    </>
  )
}
