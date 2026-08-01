import { database } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { getGiveawayPhase, GIVEAWAY_PHASES } from '@uni-feedback/utils'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  BrowseSection,
  ContributeCTASection,
  ContributeStrip,
  CTASection,
  FounderSection,
  GiveawayPromoSection,
  HeroSection,
  LandingFAQSection,
  LiveFeedSection,
  MoreThanYourNetworkSection,
  SupportersSection,
  TestimonialsSection,
  TrustSection
} from '~/components'
import { buildMeta, metaT } from '~/utils/meta'

import type { Route } from './+types/landing'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'landing')
  return buildMeta({
    matches,
    title: t('meta_title'),
    description: t('meta_desc')
  })
}

export async function loader({ request }: Route.LoaderArgs) {
  const db = database()

  // Resolved here, like the campaign page's, so the promo band cannot differ
  // between the server render and hydration and flips at midnight on its own.
  // `?phase=drawing` previews the closed band in dev only.
  const requested = import.meta.env.DEV
    ? new URL(request.url).searchParams.get('phase')
    : null
  const override = GIVEAWAY_PHASES.find((candidate) => candidate === requested)
  const giveawayPhase = override ?? getGiveawayPhase()

  const [
    studentClubs,
    faculties,
    degrees,
    testimonials,
    recentFeedbacks,
    totalFeedbackResult,
    contributorResult
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
      )
  ])

  return {
    studentClubs,
    faculties,
    degrees,
    recentFeedbacks: recentFeedbacks
      .filter(
        (f): f is typeof f & { course: NonNullable<(typeof f)['course']> } =>
          f.course !== null
      )
      .map((f) => ({
        id: f.id,
        courseId: f.courseId,
        rating: f.rating,
        workloadRating: f.workloadRating,
        comment: f.comment,
        createdAt: f.createdAt,
        course: {
          name: f.course.name,
          degree:
            f.course.degree?.faculty != null
              ? { faculty: { shortName: f.course.degree.faculty.shortName } }
              : null
        }
      })),
    testimonials,
    giveawayPhase,
    stats: {
      totalFeedback: roundDownToNice(Number(totalFeedbackResult[0].count)),
      contributors: roundDownToNice(Number(contributorResult[0].count))
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
    giveawayPhase,
    stats
  } = loaderData

  return (
    <>
      <HeroSection stats={stats} />
      {/* <UniversitiesStrip faculties={faculties} /> */}
      <SupportersSection studentClubs={studentClubs} />
      <GiveawayPromoSection phase={giveawayPhase} />
      <LiveFeedSection feedbacks={recentFeedbacks} />
      <ContributeStrip />
      <TrustSection />
      <BrowseSection faculties={faculties} degrees={degrees} />
      <MoreThanYourNetworkSection />
      <FounderSection />
      <TestimonialsSection testimonials={testimonials} />
      <ContributeCTASection />
      <LandingFAQSection />
      <CTASection contributors={stats.contributors} />
    </>
  )
}
