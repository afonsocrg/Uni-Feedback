import type { TFunction } from 'i18next'
import type { Lang } from '~/i18n/config'
import { formatEur, formatSchoolYear, type FaqItem } from '../degree/content'
import type {
  FacultyFeesPageData,
  FeeAmount,
  FeePageType,
  FeesPageDegree
} from './types'

/**
 * What the propinas page says in words (FAQ, meta description), shared by the
 * page and its meta so the FAQ shown and the FAQPage markup never disagree.
 * Only from the figures the page shows; a question with no data is not asked.
 */

/**
 * Below this many degrees with a fee the propinas page is thin (one row): it
 * stays up for the links into it, but `noindex` and out of the sitemap.
 */
export const FEES_PAGE_MIN_INDEXED = 3

export type FeeSide = 'national' | 'international'

/** "697 € por ano" */
export function feeAmountText(
  t: TFunction<'browse'>,
  lang: Lang,
  fee: FeeAmount
): string {
  return `${formatEur(fee.amountEur, lang)} ${t(`degree_page.fees.period.${fee.period}`, { defaultValue: '' })}`.trim()
}

export interface FeeSummary {
  min: FeeAmount
  max: FeeAmount
  /** The degree with the highest fee, when it alone has it */
  maxDegree: FeesPageDegree | null
  count: number
}

/** This year's fees of one side, or next year's */
export function sideFees(
  d: FeesPageDegree,
  side: FeeSide,
  year: 'current' | 'next' = 'current'
): FeeAmount[] {
  return year === 'next' ? d.next[side] : d[side]
}

/**
 * The range of one side's fees across degrees, compared on each degree's main
 * fee (per year first). Null when the degrees charge by different periods
 * (per year vs whole programme): a range across them would mislead.
 */
export function summarizeFees(
  degrees: FeesPageDegree[],
  side: FeeSide,
  year: 'current' | 'next' = 'current'
): FeeSummary | null {
  const main = degrees
    .filter((d) => sideFees(d, side, year).length > 0)
    .map((d) => ({ degree: d, fee: sideFees(d, side, year)[0] }))
  if (main.length === 0) return null
  const period = main[0].fee.period
  if (main.some((m) => m.fee.period !== period)) return null
  const sorted = [...main].sort((a, b) => a.fee.amountEur - b.fee.amountEur)
  const top = sorted.at(-1)!
  const tied = sorted.filter((m) => m.fee.amountEur === top.fee.amountEur)
  return {
    min: sorted[0].fee,
    max: top.fee,
    maxDegree: tied.length === 1 ? top.degree : null,
    count: main.length
  }
}

const isUniform = (s: FeeSummary) => s.min.amountEur === s.max.amountEur

export function feesOfType(
  data: FacultyFeesPageData,
  type: FeePageType
): FeesPageDegree[] {
  return data.degrees.filter((d) => d.type === type)
}

export function hasAnyFee(d: FeesPageDegree): boolean {
  return d.national.length > 0 || d.international.length > 0
}

/** The sides (national, international) with next year's fees published */
export function nextYearSides(data: FacultyFeesPageData): FeeSide[] {
  return (['national', 'international'] as const).filter((side) =>
    data.degrees.some((d) => d.next[side].length > 0)
  )
}

/** "estudantes internacionais", "estudantes nacionais e internacionais" */
function studentsText(t: TFunction<'browse'>, sides: FeeSide[]): string {
  return sides.length === 2
    ? t('faculty_fees.students_both')
    : t(`degree_page.fees.student.${sides[0]}`)
}

/** The types the page has a section for, in page order */
export function feeSectionTypes(data: FacultyFeesPageData): FeePageType[] {
  return [...new Set(data.degrees.map((d) => d.type))]
}

function sideText(
  t: TFunction<'browse'>,
  lang: Lang,
  summary: FeeSummary,
  side: FeeSide
): string {
  return isUniform(summary)
    ? t(`faculty_fees.faq.${side}_uniform`, {
        fee: feeAmountText(t, lang, summary.min)
      })
    : t(`faculty_fees.faq.${side}_range`, {
        // "entre 825 € e 2 500 € por ano": the period once
        min: formatEur(summary.min.amountEur, lang),
        max: feeAmountText(t, lang, summary.max)
      })
}

export function buildFeesFaq(
  t: TFunction<'browse'>,
  lang: Lang,
  facultyShortName: string,
  data: FacultyFeesPageData
): FaqItem[] {
  const year = formatSchoolYear(data.schoolYear)
  const items: FaqItem[] = []

  for (const type of feeSectionTypes(data)) {
    const degrees = feesOfType(data, type)
    const national = summarizeFees(degrees, 'national')
    const international = summarizeFees(degrees, 'international')
    const parts = [
      national && sideText(t, lang, national, 'national'),
      international && sideText(t, lang, international, 'international')
    ].filter((p): p is string => Boolean(p))
    if (parts.length === 0) continue
    items.push({
      topic: `fees_${type}`,
      isMarkdown: false,
      question: t(`faculty_fees.faq.type_q.${type}`, {
        name: facultyShortName
      }),
      answer: t('faculty_fees.faq.type_a', { year, parts: parts.join('; ') })
    })

    // "Qual é o mestrado mais caro?" where fees differ by degree
    if (
      national &&
      national.maxDegree &&
      national.count >= 3 &&
      !isUniform(national)
    ) {
      items.push({
        topic: `fees_${type}_most_expensive`,
        isMarkdown: false,
        question: t(`faculty_fees.faq.most_expensive_q.${type}`, {
          name: facultyShortName
        }),
        answer: t('faculty_fees.faq.most_expensive_a', {
          name: national.maxDegree.name,
          acronym: national.maxDegree.acronym,
          fee: feeAmountText(t, lang, national.max),
          year
        })
      })
    }
  }

  // "Já se sabe quanto vão custar em 2027/28?", once next year is out
  const nextSides = nextYearSides(data)
  if (nextSides.length > 0) {
    // Published sides first, then the ones still missing
    const order = [
      ...nextSides,
      ...(['national', 'international'] as const).filter(
        (side) => !nextSides.includes(side)
      )
    ]
    const sentences = order.map((side) => {
      if (!nextSides.includes(side)) {
        return t('faculty_fees.faq.next_missing', {
          students: t(`degree_page.fees.student.${side}`)
        })
      }
      const list = feeSectionTypes(data).flatMap((type) => {
        const summary = summarizeFees(feesOfType(data, type), side, 'next')
        if (!summary) return []
        const label = t(`degree_types.${type}`).toLowerCase()
        return [
          isUniform(summary)
            ? t('faculty_fees.faq.next_uniform', {
                type: label,
                fee: feeAmountText(t, lang, summary.min)
              })
            : t('faculty_fees.faq.next_range', {
                type: label,
                min: formatEur(summary.min.amountEur, lang),
                max: feeAmountText(t, lang, summary.max)
              })
        ]
      })
      return t('faculty_fees.faq.next_side', {
        students: t(`degree_page.fees.student.${side}`),
        list: list.join('; ')
      })
    })
    items.push({
      topic: 'fees_next_year',
      isMarkdown: false,
      question: t('faculty_fees.faq.next_q', {
        name: facultyShortName,
        next: formatSchoolYear(data.schoolYear + 1)
      }),
      answer: sentences.join(' ')
    })
  }

  return items
}

/** The meta description: what the page answers, with its headline figures */
export function feesMetaDescription(
  t: TFunction<'browse'>,
  lang: Lang,
  facultyName: string,
  data: FacultyFeesPageData
): string {
  const year = formatSchoolYear(data.schoolYear)
  const withFee = data.degrees.filter(hasAnyFee).length
  const parts = [
    t('faculty_fees.meta.description', {
      name: facultyName,
      year,
      count: withFee
    })
  ]
  for (const type of ['bachelor', 'master'] as const) {
    const summary = summarizeFees(feesOfType(data, type), 'national')
    if (!summary) continue
    parts.push(
      isUniform(summary)
        ? t(`faculty_fees.meta.${type}_uniform`, {
            fee: feeAmountText(t, lang, summary.min)
          })
        : t(`faculty_fees.meta.${type}_range`, {
            min: formatEur(summary.min.amountEur, lang),
            max: feeAmountText(t, lang, summary.max)
          })
    )
  }
  const nextSides = nextYearSides(data)
  if (nextSides.length > 0) {
    parts.push(
      t('faculty_fees.meta.next', {
        next: formatSchoolYear(data.schoolYear + 1),
        students: studentsText(t, nextSides)
      })
    )
  }
  return parts.join(' ')
}

/** The page title: names next year too once it's out ("2026/27 e 2027/28") */
export function feesMetaTitle(
  t: TFunction<'browse'>,
  facultyShortName: string,
  data: FacultyFeesPageData
): string {
  const year = formatSchoolYear(data.schoolYear)
  return nextYearSides(data).length > 0
    ? t('faculty_fees.meta.title_next', {
        shortName: facultyShortName,
        year,
        next: formatSchoolYear(data.schoolYear + 1)
      })
    : t('faculty_fees.meta.title', { shortName: facultyShortName, year })
}

/** The header fact and the about line about next year's fees */
export function nextYearNote(
  t: TFunction<'browse'>,
  data: FacultyFeesPageData,
  key: 'facts.next' | 'about.next'
): string | null {
  const sides = nextYearSides(data)
  if (sides.length === 0) return null
  return t(`faculty_fees.${key}`, {
    next: formatSchoolYear(data.schoolYear + 1),
    students: studentsText(t, sides)
  })
}
