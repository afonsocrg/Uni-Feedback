import { database, schema } from '@uni-feedback/db'
import { eq, isNotNull, max, sql } from 'drizzle-orm'
import { isCourseIndexable } from '~/utils/course'
import { getLocalePath } from '~/utils/i18n-routes'
import { getRequestOrigin } from '~/utils/request'

interface PagePair {
  pt: string
  en: string
  changefreq: string
  priority: number
  /**
   * When the page's content last changed. Omitted rather than guessed: a
   * lastmod that is always "now" teaches crawlers to ignore the field.
   */
  lastmod?: Date | null
}

function renderUrlEntry(
  origin: string,
  pair: PagePair,
  lang: 'pt' | 'en'
): string {
  const loc = `${origin}${pair[lang]}`
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="pt" href="${origin}${pair.pt}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${origin}${pair.en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${pair.pt}"/>`,
    ...(pair.lastmod
      ? [`    <lastmod>${pair.lastmod.toISOString()}</lastmod>`]
      : []),
    `    <changefreq>${pair.changefreq}</changefreq>`,
    `    <priority>${pair.priority}</priority>`,
    '  </url>'
  ].join('\n')
}

function renderPair(origin: string, pair: PagePair): string {
  return [
    renderUrlEntry(origin, pair, 'pt'),
    renderUrlEntry(origin, pair, 'en')
  ].join('\n')
}

function latest(...dates: (Date | null | undefined)[]): Date | null {
  return dates.reduce<Date | null>(
    (acc, d) => (d && (!acc || d > acc) ? d : acc),
    null
  )
}

export async function loader({ request }: { request: Request }) {
  const db = database()
  const origin = getRequestOrigin(request)

  const [faculties, degrees, courses, feedbackStats, identicalPairs] =
    await Promise.all([
      db
        .select({ id: schema.faculties.id, slug: schema.faculties.slug })
        .from(schema.faculties),
      db
        .select({
          id: schema.degrees.id,
          facultyId: schema.faculties.id,
          facultySlug: schema.faculties.slug,
          degreeSlug: schema.degrees.slug
        })
        .from(schema.degrees)
        .innerJoin(
          schema.faculties,
          eq(schema.degrees.facultyId, schema.faculties.id)
        ),
      db
        .select({
          id: schema.courses.id,
          degreeId: schema.courses.degreeId,
          description: schema.courses.description,
          assessment: schema.courses.assessment,
          bibliography: schema.courses.bibliography,
          updatedAt: schema.courses.updatedAt
        })
        .from(schema.courses),
      db
        .select({
          courseId: schema.feedback.courseId,
          count: sql<number>`count(*)::integer`,
          lastApprovedAt: max(schema.feedback.approvedAt)
        })
        .from(schema.feedback)
        .where(isNotNull(schema.feedback.approvedAt))
        .groupBy(schema.feedback.courseId),
      db
        .select({
          sourceCourseId: schema.courseRelationships.sourceCourseId,
          targetCourseId: schema.courseRelationships.targetCourseId
        })
        .from(schema.courseRelationships)
        .where(eq(schema.courseRelationships.relationshipType, 'identical'))
    ])

  // A course page shows its own feedback plus that of its "identical"
  // courses (see getFeedbackWhereCondition), so count it the same way here.
  // Done in memory: one grouped scan beats a correlated subquery per course.
  const statsByCourse = new Map(feedbackStats.map((f) => [f.courseId, f]))
  const identicalTo = new Map<number, number[]>()
  for (const { sourceCourseId, targetCourseId } of identicalPairs) {
    identicalTo.set(sourceCourseId, [
      ...(identicalTo.get(sourceCourseId) ?? []),
      targetCourseId
    ])
  }

  const degreeLastmod = new Map<number, Date>()
  const indexableCourses = courses.flatMap((course) => {
    const stats = [course.id, ...(identicalTo.get(course.id) ?? [])]
      .map((id) => statsByCourse.get(id))
      .filter((s) => s !== undefined)
    const totalFeedbackCount = stats.reduce((sum, s) => sum + s.count, 0)
    if (!isCourseIndexable({ ...course, totalFeedbackCount })) return []

    const lastmod = latest(
      course.updatedAt,
      ...stats.map((s) => s.lastApprovedAt)
    )
    if (course.degreeId && lastmod) {
      const current = latest(degreeLastmod.get(course.degreeId), lastmod)
      if (current) degreeLastmod.set(course.degreeId, current)
    }
    return [{ id: course.id, lastmod }]
  })

  const facultyLastmod = new Map<number, Date>()
  for (const degree of degrees) {
    const current = latest(
      facultyLastmod.get(degree.facultyId),
      degreeLastmod.get(degree.id)
    )
    if (current) facultyLastmod.set(degree.facultyId, current)
  }

  const staticPairs: PagePair[] = [
    {
      pt: getLocalePath('home', 'pt'),
      en: getLocalePath('home', 'en'),
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      pt: getLocalePath('browse', 'pt'),
      en: getLocalePath('browse', 'en'),
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      pt: getLocalePath('supporters', 'pt'),
      en: getLocalePath('supporters', 'en'),
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      pt: getLocalePath('terms', 'pt'),
      en: getLocalePath('terms', 'en'),
      changefreq: 'yearly',
      priority: 0.3
    },
    {
      pt: getLocalePath('privacy', 'pt'),
      en: getLocalePath('privacy', 'en'),
      changefreq: 'yearly',
      priority: 0.3
    }
  ]

  const dynamicPairs: PagePair[] = [
    ...faculties
      .filter((f) => f.slug)
      .map((f) => ({
        pt: `/${f.slug}`,
        en: `/en/${f.slug}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: facultyLastmod.get(f.id)
      })),
    ...degrees
      .filter((d) => d.facultySlug && d.degreeSlug)
      .map((d) => ({
        pt: `/${d.facultySlug}/${d.degreeSlug}`,
        en: `/en/${d.facultySlug}/${d.degreeSlug}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: degreeLastmod.get(d.id)
      })),
    ...indexableCourses.map((c) => ({
      pt: `/cadeiras/${c.id}`,
      en: `/en/courses/${c.id}`,
      changefreq: 'weekly',
      priority: 0.9,
      lastmod: c.lastmod
    }))
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...[...staticPairs, ...dynamicPairs].map((pair) =>
      renderPair(origin, pair)
    ),
    '</urlset>'
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
