import { database } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { getGiveawayPhase, GIVEAWAY_PHASES } from '@uni-feedback/utils'
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import type { ReactNode } from 'react'
import {
  AskChatSection,
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
  TrackedSection,
  TrustSection
} from '~/components'
import type { LandingSection } from '~/utils/analytics'
import { INSTAGRAM_URL, TIKTOK_URL } from '~/utils/constants'
import { detectLang } from '~/utils/i18n-routes'
import { buildMeta, metaOrigin, metaT, SITE_NAME } from '~/utils/meta'

import type { Route } from './+types/landing'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'landing')
  const origin = metaOrigin(matches)
  // A count rather than a list of schools: naming a few of them made the
  // coverage look smaller than it is, and this stays right as schools are added.
  const facultyCount = loaderData?.faculties.length
  return buildMeta({
    matches,
    title: t('meta_title'),
    description: facultyCount
      ? t('meta_desc', { count: facultyCount })
      : undefined,
    // WebSite is what Google reads for the site name it shows in results, and
    // Organization ties the brand to its logo and social profiles.
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${origin}/`,
        inLanguage: detectLang(location.pathname)
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${origin}/`,
        logo: `${origin}/web-app-manifest-512x512.png`,
        sameAs: [INSTAGRAM_URL, TIKTOK_URL]
      }
    ]
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

  // Order chosen from data (2026-10-18): the median landing visit sees about
  // one screen, and the hero search is the page's main action. The supporters
  // strip reads as part of the hero, so it stays under the search bar, and the
  // chat comes right after it: close to the top, but not on the first screen,
  // where a second input box next to the search would compete with it.
  // Everything below reaches a shrinking minority; see `landing_section_viewed`
  // for the per-section reach.
  const sections: Array<[LandingSection, ReactNode]> = [
    ['hero', <HeroSection stats={stats} />],
    ['supporters', <SupportersSection studentClubs={studentClubs} />],
    ['ask_chat', <AskChatSection />],
    ['live_feed', <LiveFeedSection feedbacks={recentFeedbacks} />],
    // Only while an edition is running or being drawn: once winners are out
    // the band is stale, and the footer still links to the giveaway.
    ...(giveawayPhase !== 'announced'
      ? [
          [
            'giveaway_promo',
            <GiveawayPromoSection phase={giveawayPhase} />
          ] as [LandingSection, ReactNode]
        ]
      : []),
    ['contribute_strip', <ContributeStrip />],
    ['trust', <TrustSection />],
    ['browse', <BrowseSection faculties={faculties} degrees={degrees} />],
    ['more_than_your_network', <MoreThanYourNetworkSection />],
    ['founder', <FounderSection />],
    ['testimonials', <TestimonialsSection testimonials={testimonials} />],
    ['contribute_cta', <ContributeCTASection />],
    ['faq', <LandingFAQSection />],
    ['final_cta', <CTASection contributors={stats.contributors} />]
  ]

  return (
    <>
      {sections.map(([section, node], position) => (
        <TrackedSection key={section} section={section} position={position}>
          {node}
        </TrackedSection>
      ))}
    </>
  )
}
