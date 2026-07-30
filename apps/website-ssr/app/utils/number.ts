import type { Lang } from '~/i18n/config'

/**
 * `pt-BR`, not `pt-PT`, for the Portuguese side. ICU formats pt-PT with a
 * non-breaking space and skips grouping entirely below five digits ("1228",
 * "85 357"), which is neither what Portuguese students write nor readable at a
 * glance. pt-BR gives the dot grouping everyone here actually uses ("1.228",
 * "85.357"), and the two locales differ in nothing else that a plain integer
 * touches.
 */
const NUMBER_LOCALES: Record<Lang, string> = {
  pt: 'pt-BR',
  en: 'en-US'
}

/**
 * Thousands-separated count in the page's language (1.300 in PT, 1,300 in EN).
 *
 * The locale is passed explicitly rather than left to the runtime default:
 * SSR renders on the server, where the default locale is the server's, and
 * hydration would then mismatch the browser's.
 */
export function formatCount(value: number, lang: Lang): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[lang]).format(value)
}
