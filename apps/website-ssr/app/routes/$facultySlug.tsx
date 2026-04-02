import { database, schema } from '@uni-feedback/db'
import { and, eq, gt, sql } from 'drizzle-orm'
import { useEffect } from 'react'
import { FacultyPageContent } from '~/components'
import { userPreferences } from '~/utils'
import { SITE_URL } from '~/utils/constants'

import type { Route } from './+types/$facultySlug'

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData.faculty) {
    return [
      { title: 'Faculty Not Found - Uni Feedback' },
      { name: 'description', content: 'The requested faculty was not found.' }
    ]
  }

  const { faculty, degrees } = loaderData

  // Build title
  const title = `${faculty.name} (${faculty.shortName}) - Degrees & Course Reviews - Uni Feedback`

  // Build description with stats
  const totalCourses = degrees.reduce(
    (sum, d) => sum + Number(d.courseCount),
    0
  )
  const totalFeedback = degrees.reduce(
    (sum, d) => sum + Number(d.feedbackCount),
    0
  )

  let description = `Browse ${degrees.length} degree${degrees.length !== 1 ? 's' : ''} and ${totalCourses} course${totalCourses !== 1 ? 's' : ''} from ${faculty.name}`

  if (totalFeedback > 0) {
    description += ` with ${totalFeedback} student review${totalFeedback !== 1 ? 's' : ''}`
  }

  description +=
    '. Read honest, anonymous feedback to help you choose the right courses.'

  // Add top degrees to description
  const topDegrees = degrees
    .slice(0, 3)
    .map((d) => d.name)
    .join(', ')
  if (topDegrees) {
    description += ` Popular degrees: ${topDegrees}.`
  }

  // Schema.org structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: faculty.name,
    alternateName: faculty.shortName,
    url: `${SITE_URL}/${faculty.slug}`,
    ...(degrees.length > 0 && {
      department: degrees.map((degree) => ({
        '@type': 'EducationalOrganization',
        name: degree.name,
        alternateName: degree.acronym,
        url: `${SITE_URL}/${faculty.slug}/${degree.slug}`
      }))
    })
  }

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },

    // Keywords for SEO
    {
      name: 'keywords',
      content: [
        faculty.name,
        faculty.shortName,
        'degrees',
        'course reviews',
        'student feedback',
        ...degrees.map((d) => d.name),
        ...degrees.map((d) => d.acronym)
      ].join(', ')
    },

    // Schema.org structured data
    { 'script:ld+json': structuredData }
  ]
}

export async function loader({ params }: Route.LoaderArgs) {
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
    degrees: degreesWithCounts
  }
}

export default function FacultyPage({ loaderData }: Route.ComponentProps) {
  // Persist selection when component mounts
  useEffect(() => {
    if (loaderData.faculty?.slug) {
      userPreferences.set({
        lastSelectedFacultySlug: loaderData.faculty.slug,
        lastVisitedPath: `/${loaderData.faculty.slug}`
      })
    }
  }, [loaderData.faculty?.slug])

  return (
    <FacultyPageContent
      faculty={loaderData.faculty}
      degrees={loaderData.degrees}
    />
  )
}
