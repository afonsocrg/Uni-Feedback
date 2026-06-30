import type { MetaDescriptor } from 'react-router'

/**
 * Centralized SEO / social metadata.
 *
 * React Router does NOT merge `meta` across the route hierarchy — the leaf
 * route's `meta` export fully replaces any ancestor's. So shared defaults
 * (site name, Twitter card, etc.) can't live in `root.tsx`; instead every
 * route builds its descriptors through `buildMeta`, overriding only what it
 * needs. This keeps tags like `og:site_name` present on every page.
 */
export const SITE_NAME = 'Uni Feedback'

interface MetaImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

interface BuildMetaOptions {
  /** Document title — also used for og:title / twitter:title. */
  title: string
  description?: string
  /** Absolute canonical URL → og:url. */
  url?: string
  /** og:type. Defaults to 'website'. */
  type?: string
  /** Absolute image URL (or descriptor) → og:image / twitter:image. */
  image?: string | MetaImage
  /** twitter:card. Defaults to 'summary_large_image' when an image is set, else 'summary'. */
  twitterCard?: 'summary' | 'summary_large_image'
  robots?: string
  keywords?: string | string[]
  /** Schema.org JSON-LD object(s). */
  structuredData?: object | object[]
  /** Any extra raw descriptors to append. */
  extra?: MetaDescriptor[]
}

export function buildMeta({
  title,
  description,
  url,
  type = 'website',
  image,
  twitterCard = image ? 'summary_large_image' : 'summary',
  robots,
  keywords,
  structuredData,
  extra = []
}: BuildMetaOptions): MetaDescriptor[] {
  const img = typeof image === 'string' ? { url: image } : image

  return [
    { title },
    ...(description ? [{ name: 'description', content: description }] : []),

    // Open Graph
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: title },
    ...(description
      ? [{ property: 'og:description', content: description }]
      : []),
    { property: 'og:type', content: type },
    ...(url ? [{ property: 'og:url', content: url }] : []),
    ...(img
      ? [
          { property: 'og:image', content: img.url },
          ...(img.width
            ? [{ property: 'og:image:width', content: String(img.width) }]
            : []),
          ...(img.height
            ? [{ property: 'og:image:height', content: String(img.height) }]
            : []),
          ...(img.alt ? [{ property: 'og:image:alt', content: img.alt }] : [])
        ]
      : []),

    // Twitter
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: title },
    ...(description
      ? [{ name: 'twitter:description', content: description }]
      : []),
    ...(img ? [{ name: 'twitter:image', content: img.url }] : []),

    ...(robots ? [{ name: 'robots', content: robots }] : []),
    ...(keywords
      ? [
          {
            name: 'keywords',
            content: Array.isArray(keywords) ? keywords.join(', ') : keywords
          }
        ]
      : []),
    ...((structuredData
      ? (Array.isArray(structuredData) ? structuredData : [structuredData]).map(
          (data) => ({ 'script:ld+json': data })
        )
      : []) as MetaDescriptor[]),

    ...extra
  ]
}
