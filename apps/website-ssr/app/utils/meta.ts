import type { Namespace, TFunction } from 'i18next'
import type { Location, MetaDescriptor } from 'react-router'
import { i18n } from '~/i18n/config'
import type { loader as rootLoader } from '~/root'
import { SITE_URL } from '~/utils/constants'
import { detectLang } from '~/utils/i18n-routes'

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

/**
 * Fixed-language `t` for use inside a route's `meta` export.
 *
 * `meta` runs outside React, so the `useTranslation` hook isn't available.
 * The language is derived from the URL (same rule as the rest of the app),
 * and `getFixedT` reads that language explicitly rather than depending on the
 * shared instance's current state — correct regardless of render timing.
 */
export function metaT<Ns extends Namespace>(
  location: Pick<Location, 'pathname'>,
  ns: Ns
): TFunction<Ns> {
  return i18n.getFixedT(detectLang(location.pathname), ns)
}

interface MetaImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

/**
 * The root loader's return, typed from the loader itself (single source of
 * truth) — it carries the request-derived `origin` and `lang`. `meta` has no
 * access to the request, but React Router exposes ancestor loader data through
 * `matches`, and the root match is always `matches[0]`.
 */
type RootData = Awaited<ReturnType<typeof rootLoader>>

function rootData(matches?: readonly [{ data?: RootData }?, ...unknown[]]) {
  return matches?.[0]?.data
}

/**
 * Branded social card shipped for every page that doesn't supply its own.
 * Static PNGs live in `public/og/`; one per language. Rendered from the
 * "OG Images" design (1200 × 630). The URL must be absolute for social
 * scrapers, so it's built off the request `origin` (SITE_URL is only a
 * dev-time fallback for when no root match is available).
 */
function defaultOgImage(root: RootData | undefined): MetaImage {
  const lang = root?.lang ?? 'pt'
  const origin = root?.origin ?? SITE_URL
  return {
    url: `${origin}/og/og-${lang}.png`,
    width: 1200,
    height: 630,
    alt: SITE_NAME
  }
}

interface BuildMetaOptions {
  /** Document title — also used for og:title / twitter:title. */
  title: string
  description?: string
  /** Absolute canonical URL → og:url. */
  url?: string
  /** og:type. Defaults to 'website'. */
  type?: string
  /**
   * The route's `matches` from `Route.MetaArgs`. Used to read the request
   * `origin` and `lang` off the root loader so the default OG image is an
   * absolute, language-correct URL. Pass it on any page that doesn't set its
   * own `image`.
   */
  matches?: readonly [{ data?: RootData }?, ...unknown[]]
  /**
   * Absolute image URL (or descriptor) → og:image / twitter:image. Omit to use
   * the branded per-language default (see {@link defaultOgImage}).
   */
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
  matches,
  image,
  twitterCard = 'summary_large_image',
  robots,
  keywords,
  structuredData,
  extra = []
}: BuildMetaOptions): MetaDescriptor[] {
  const resolvedImage = image ?? defaultOgImage(rootData(matches))
  const img =
    typeof resolvedImage === 'string' ? { url: resolvedImage } : resolvedImage

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
