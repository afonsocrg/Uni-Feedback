import { database, schema } from '@uni-feedback/db'
import { and, eq, gt, sql } from 'drizzle-orm'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { FacultyPageContent } from '~/components'
import { userPreferences } from '~/utils'

import { detectLang, getDegreePath, getFacultyPath } from '~/utils/i18n-routes'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/$facultySlug'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')
  const lang = detectLang(location.pathname)

  if (!loaderData.faculty) {
    return buildMeta({
      matches,
      title: 'Faculty Not Found - Uni Feedback',
      description: 'The requested faculty was not found.'
    })
  }

  const { faculty, degrees, origin } = loaderData

  const title = t('meta.faculty_title', {
    name: faculty.name,
    shortName: faculty.shortName
  })

  const totalFeedback = degrees.reduce(
    (sum, d) => sum + Number(d.feedbackCount),
    0
  )
  const description =
    totalFeedback > 0
      ? t('meta.faculty_description_reviews', {
          shortName: faculty.shortName,
          count: totalFeedback
        })
      : t('meta.faculty_description', { shortName: faculty.shortName })

  // Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: faculty.name,
    alternateName: faculty.shortName,
    ...(faculty.slug && {
      url: `${origin}${getFacultyPath('pt', faculty.slug)}`
    }),
    ...(degrees.length > 0 && {
      department: degrees.map((degree) => ({
        '@type': 'EducationalOrganization',
        name: degree.name,
        alternateName: degree.acronym,
        ...(degree.slug && {
          url: `${origin}${getDegreePath('pt', faculty.slug!, degree.slug)}`
        })
      }))
    })
  }

  return buildMeta({
    matches,
    title,
    description,
    url: faculty.slug
      ? `${origin}${getFacultyPath(lang, faculty.slug)}`
      : undefined,
    keywords: [
      faculty.name,
      faculty.shortName,
      'degrees',
      'course reviews',
      'student feedback',
      ...degrees.map((d) => d.name),
      ...degrees.map((d) => d.acronym)
    ].filter((k): k is string => Boolean(k)),
    structuredData
  })
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { facultySlug } = params
  const db = database()

  // Find the faculty by slug
  const faculty = await db.query.faculties.findFirst({
    where: (faculties, { eq }) => eq(faculties.slug, facultySlug)
  })

  if (!faculty) {
    throw new Response('Faculty not found', { status: 404 })
  }

  // Get degrees with pre-computed stats from degreeStats table
  const degreesWithCounts = await db
    .select({
      id: schema.degrees.id,
      externalId: schema.degrees.externalId,
      type: schema.degrees.type,
      name: schema.degrees.name,
      acronym: schema.degrees.acronym,
      slug: schema.degrees.slug,
      courseCount:
        sql<number>`coalesce(${schema.degreeStats.courseCount}, 0)`.as(
          'course_count'
        ),
      feedbackCount:
        sql<number>`coalesce(${schema.degreeStats.feedbackCount}, 0)`.as(
          'feedback_count'
        )
    })
    .from(schema.degrees)
    .leftJoin(
      schema.degreeStats,
      eq(schema.degreeStats.degreeId, schema.degrees.id)
    )
    .where(
      and(
        eq(schema.degrees.facultyId, faculty.id),
        gt(sql`coalesce(${schema.degreeStats.courseCount}, 0)`, 0)
      )
    )

  return {
    faculty,
    degrees: degreesWithCounts,
    origin: getRequestOrigin(request)
  }
}

export default function FacultyPage({ loaderData }: Route.ComponentProps) {
  const location = useLocation()
  // Persist selection when component mounts
  useEffect(() => {
    if (loaderData.faculty?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: loaderData.faculty.slug,
        lastVisitedPath: location.pathname
      })
    }
  }, [loaderData.faculty?.slug, location.pathname])

  return (
    <FacultyPageContent
      faculty={loaderData.faculty}
      degrees={loaderData.degrees}
    />
  )
}
