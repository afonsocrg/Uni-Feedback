import type { Lang } from '~/i18n/config'

/**
 * Picks an entity's copy in the page's language, falling back to Portuguese
 * (prds/content_translation.md, "Rendering and fallback"). One helper for
 * every entity, so universities, faculties, degrees and courses fall back the
 * same way:
 *
 * - **Names** fall back silently: `name` is the official Portuguese name and
 *   `name_en` the English one, NULL when there is none (an untranslated brand
 *   like "Universidade de Lisboa" stays as it is).
 * - **Long text** (descriptions, intros) falls back to the Portuguese text,
 *   which the page renders with `lang="pt"` and a muted "Available in
 *   Portuguese only" note (`LocalizedText`). Only reviewed text is ever passed
 *   in: unreviewed rows are filtered out by the loaders.
 *
 * Every pick says whether it fell back, so a page can tell when its main
 * content is all Portuguese and set `noindex, follow` on the EN route
 * (decision 8): `isMostlyFallback`.
 */

export type ContentLang = 'pt' | 'en'

export interface Localized<T> {
  value: T
  /** The language `value` is in */
  lang: ContentLang
  /** True when the page's language had none and `value` is the Portuguese one */
  fellBack: boolean
}

/** `name_en` on EN pages, else `name` */
export function pickName(
  lang: Lang,
  name: string,
  nameEn: string | null | undefined
): Localized<string> {
  if (lang === 'en' && nameEn) {
    return { value: nameEn, lang: 'en', fellBack: false }
  }
  return { value: name, lang: 'pt', fellBack: lang === 'en' }
}

/**
 * The text in the page's language, else the Portuguese one; null when there is
 * neither. `texts` holds reviewed text only.
 */
export function pickText(
  lang: Lang,
  texts: Partial<Record<ContentLang, string | null | undefined>>
): Localized<string> | null {
  const own = texts[lang]
  if (own) return { value: own, lang, fellBack: false }
  const pt = texts.pt
  if (pt) return { value: pt, lang: 'pt', fellBack: lang !== 'pt' }
  return null
}

/**
 * Like `pickText`, for text that may exist only in English: the faculty's own
 * course content (Nova SBE and much of Nova FCT publish in English). The page's
 * language first, else whichever language there is; `fellBack` says the text
 * is not in the page's language, and `lang` which one it is in.
 */
export function pickTextEither(
  lang: Lang,
  texts: Partial<Record<ContentLang, string | null | undefined>>
): Localized<string> | null {
  const own = texts[lang]
  if (own) return { value: own, lang, fellBack: false }
  const other: ContentLang = lang === 'en' ? 'pt' : 'en'
  const text = texts[other]
  return text ? { value: text, lang: other, fellBack: true } : null
}

/**
 * The other language's name, for search that should match both ("Química"
 * and "Chemistry"): `name_en` on PT pages, `name` on EN pages, null when equal.
 */
export function altName(
  lang: Lang,
  name: string,
  nameEn: string | null | undefined
): string | null {
  if (!nameEn || nameEn === name) return null
  return lang === 'en' ? name : nameEn
}

/**
 * True on an EN page whose long text all fell back to Portuguese (and there was
 * some). Names are left out: a brand kept in Portuguese is not missing content.
 */
export function isMostlyFallback(
  texts: (Localized<unknown> | null | undefined)[]
): boolean {
  const present = texts.filter((t): t is Localized<unknown> => t != null)
  return present.length > 0 && present.every((t) => t.fellBack)
}

/**
 * An entity row with `name` replaced by its name in the page's language, for
 * loaders that hand the row on to components (`name` is then display text,
 * `nameEn` stays as stored).
 */
export function withLocalizedName<
  T extends { name: string; nameEn: string | null }
>(row: T, lang: Lang): T {
  return { ...row, name: pickName(lang, row.name, row.nameEn).value }
}
