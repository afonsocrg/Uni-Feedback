import { formatSchoolYearString } from '@uni-feedback/utils'
import type { TFunction } from 'i18next'

/** "25/26", the compact school year the percurso shows. */
export function shortSchoolYear(year: number): string {
  return formatSchoolYearString(year, { yearFormat: 'short' })
}

/**
 * The years line under a degree name: "25/26 – presente", "22/23 – 24/25",
 * "até 24/25", or "Anos por indicar" when we have neither.
 */
export function formatJourneyYears(
  t: TFunction<'feedback'>,
  start: number | null,
  end: number | null
): { text: string; known: boolean } {
  if (start !== null && end !== null) {
    return {
      text: t('profile.journey.years_range', {
        start: shortSchoolYear(start),
        end: shortSchoolYear(end)
      }),
      known: true
    }
  }
  if (start !== null) {
    return {
      text: t('profile.journey.years_ongoing', {
        start: shortSchoolYear(start)
      }),
      known: true
    }
  }
  if (end !== null) {
    return {
      text: t('profile.journey.years_until', { end: shortSchoolYear(end) }),
      known: true
    }
  }
  return { text: t('profile.journey.years_unknown'), known: false }
}
