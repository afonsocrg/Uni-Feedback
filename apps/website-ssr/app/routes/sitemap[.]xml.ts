import { database, schema } from '@uni-feedback/db'
import { eq } from 'drizzle-orm'
import { SITE_URL } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'

const DOMAIN = SITE_URL

interface PagePair {
  pt: string
  en: string
  changefreq: string
  priority: number
}

function renderUrlEntry(
  pair: PagePair,
  lang: 'pt' | 'en',
  lastmod: string
): string {
  const loc = `${DOMAIN}${pair[lang]}`
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="pt" href="${DOMAIN}${pair.pt}"/>`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${DOMAIN}${pair.en}"/>`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}${pair.pt}"/>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${pair.changefreq}</changefreq>`,
    `    <priority>${pair.priority}</priority>`,
    '  </url>'
  ].join('\n')
}

function renderPair(pair: PagePair, lastmod: string): string {
  return [
    renderUrlEntry(pair, 'pt', lastmod),
    renderUrlEntry(pair, 'en', lastmod)
  ].join('\n')
}

export async function loader() {
  const db = database()
  const lastmod = new Date().toISOString()

  const [faculties, degrees, courses] = await Promise.all([
    db.select({ slug: schema.faculties.slug }).from(schema.faculties),
    db
      .select({
        facultySlug: schema.faculties.slug,
        degreeSlug: schema.degrees.slug
      })
      .from(schema.degrees)
      .innerJoin(
        schema.faculties,
        eq(schema.degrees.facultyId, schema.faculties.id)
      ),
    db.select({ id: schema.courses.id }).from(schema.courses)
  ])

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
      pt: getLocalePath('feedback-new', 'pt'),
      en: getLocalePath('feedback-new', 'en'),
      changefreq: 'monthly',
      priority: 0.6
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
        priority: 0.7
      })),
    ...degrees
      .filter((d) => d.facultySlug && d.degreeSlug)
      .map((d) => ({
        pt: `/${d.facultySlug}/${d.degreeSlug}`,
        en: `/en/${d.facultySlug}/${d.degreeSlug}`,
        changefreq: 'weekly',
        priority: 0.8
      })),
    ...courses.map((c) => ({
      pt: `/cadeiras/${c.id}`,
      en: `/en/courses/${c.id}`,
      changefreq: 'weekly',
      priority: 0.9
    }))
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...[...staticPairs, ...dynamicPairs].map((pair) =>
      renderPair(pair, lastmod)
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
