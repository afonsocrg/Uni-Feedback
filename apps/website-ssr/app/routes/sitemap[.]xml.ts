import { generateSitemap, type SitemapRoute } from '@forge42/seo-tools/sitemap'
import { database, schema } from '@uni-feedback/db'
import { eq } from 'drizzle-orm'
import type { Route } from './+types/sitemap[.]xml'

export async function loader({ request }: Route.LoaderArgs) {
  const { routes } = await import('virtual:react-router/server-build')

  // Get the base URL from the request, with fallback for development
  const url = new URL(request.url)
  console.log({ url })
  const siteUrl =
    process.env.SITE_URL ||
    `${url.protocol}//${url.host}` ||
    'http://localhost:5173'

  const db = database()

  // Get all dynamic route data from database
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

  // Static routes
  const staticUrls: SitemapRoute[] = [
    {
      url: '/',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: 1.0
    },
    {
      url: '/browse',
      lastmod: new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: 0.9
    },
    {
      url: '/feedback/new',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.6
    },
    {
      url: '/partners',
      lastmod: new Date().toISOString(),
      changefreq: 'monthly' as const,
      priority: 0.5
    },
    {
      url: '/terms',
      lastmod: new Date().toISOString(),
      changefreq: 'yearly' as const,
      priority: 0.3
    },
    {
      url: '/privacy',
      lastmod: new Date().toISOString(),
      changefreq: 'yearly' as const,
      priority: 0.3
    }
  ]

  // Build dynamic URLs
  const dynamicUrls = [
    // Faculty pages
    ...faculties.map(
      (f) =>
        ({
          url: `/${f.slug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.7
        }) as SitemapRoute
    ),
    // Degree pages
    ...degrees.map(
      (d) =>
        ({
          url: `/${d.facultySlug}/${d.degreeSlug}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.8
        }) as SitemapRoute
    ),
    // Course pages
    ...courses.map(
      (c) =>
        ({
          url: `/courses/${c.id}`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly' as const,
          priority: 0.9
        }) as SitemapRoute
    )
  ]

  // Generate sitemap with static routes from React Router + dynamic URLs
  const sitemap = await generateSitemap({
    domain: 'https://uni-feedback.com',
    routes: [...staticUrls, ...dynamicUrls]
  })

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
}
