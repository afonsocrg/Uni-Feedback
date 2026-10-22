import { isDiscontinued } from '@uni-feedback/utils'
import type { TFunction } from 'i18next'
import type { Lang } from '~/i18n/config'
import type { CourseWithFeedback } from '../course/types'
import type { DegreeAdmissions, DegreeFees, DegreeOutcomes } from './pageTypes'

/**
 * Pure helpers shared by the degree page and its `meta` (titles, JSON-LD), so
 * the FAQ the page shows and the FAQPage markup can never disagree.
 */

const locale = (lang: Lang) => (lang === 'en' ? 'en-GB' : 'pt-PT')

/**
 * One formatter per page language for every figure on the page, the FAQ and the
 * JSON-LD text. Grouping is forced: pt-PT leaves four-digit numbers ungrouped by
 * default ("7000 €"), and the page should read "7 000 €" like the rest.
 */
function nf(lang: Lang, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(locale(lang), {
    // 'always' is ES2023; older lib typings only know booleans
    useGrouping: 'always' as unknown as boolean,
    ...options
  })
}

/** DGES grades, 0-200 scale with one decimal: "165,3" */
export function formatGrade(value: number, lang: Lang): string {
  return nf(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)
}

/** "1,1%" */
export function formatPct(value: number, lang: Lang): string {
  return `${nf(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)}%`
}

/** "1 144" / "1,144" */
export function formatInt(value: number, lang: Lang): string {
  return nf(lang, { maximumFractionDigits: 0 }).format(value)
}

/** Counts and ECTS: "1 144", "7,5" */
export function formatNumber(value: number, lang: Lang): string {
  return nf(lang, { maximumFractionDigits: 1 }).format(value)
}

/** "7 000 €" / "€7,000", cents only when there are any */
export function formatEur(value: number, lang: Lang): string {
  const whole = Number.isInteger(value)
  return nf(lang, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2
  }).format(value)
}

/** 2026 → "2026/27" */
export function formatSchoolYear(year: number): string {
  return `${year}/${String(year + 1).slice(2)}`
}

/** DGES's "2026-2027" → "2026/27"; anything else as given */
export function formatAcademicYear(value: string): string {
  const match = /^(\d{4})-(\d{4})$/.exec(value)
  return match ? formatSchoolYear(Number(match[1])) : value
}

/** A course needs this many feedbacks to be ranked in the highlights. */
export const HIGHLIGHT_MIN_FEEDBACK = 5
const HIGHLIGHT_SIZE = 3

export interface CourseHighlights {
  best: CourseWithFeedback[]
  /** Workload is inverted: 1 = very heavy, so the heaviest have the LOWEST average */
  heaviest: CourseWithFeedback[]
}

/**
 * Best rated and heaviest courses still taught, among those with enough
 * feedback to mean something. Null when fewer than three courses qualify: a
 * "top 3" of one course is noise.
 */
export function computeHighlights(
  courses: CourseWithFeedback[]
): CourseHighlights | null {
  const qualifying = courses.filter(
    (c) =>
      !isDiscontinued(c.lastTaughtYear) &&
      Number(c.totalFeedbackCount) >= HIGHLIGHT_MIN_FEEDBACK
  )
  if (qualifying.length < HIGHLIGHT_SIZE) return null

  const byCount = (a: CourseWithFeedback, b: CourseWithFeedback) =>
    Number(b.totalFeedbackCount) - Number(a.totalFeedbackCount)

  const best = qualifying
    .filter((c) => Number(c.averageRating) > 0)
    .sort(
      (a, b) =>
        Number(b.averageRating) - Number(a.averageRating) || byCount(a, b)
    )
    .slice(0, HIGHLIGHT_SIZE)

  const heaviest = qualifying
    .filter((c) => Number(c.averageWorkload) > 0)
    .sort(
      (a, b) =>
        Number(a.averageWorkload) - Number(b.averageWorkload) || byCount(a, b)
    )
    .slice(0, HIGHLIGHT_SIZE)

  if (best.length === 0 && heaviest.length === 0) return null
  return { best, heaviest }
}

/** The latest 1ª fase grade and the one before it, if any */
export function latestGrades(admissions: DegreeAdmissions | null) {
  const series = admissions?.main.series ?? []
  const latest = series.at(-1) ?? null
  const previous = series.length > 1 ? series[series.length - 2] : null
  return { latest, previous }
}

export interface FaqItem {
  question: string
  answer: string
}

interface FaqContext {
  acronym: string
  admissions: DegreeAdmissions | null
  fees: DegreeFees | null
  outcomes: DegreeOutcomes | null
  highlights: CourseHighlights | null
  workloadLabel: (rating: number) => string
  /** No course still taught: skip questions that imply the degree is open */
  isRetired?: boolean
}

/** "697 € por ano (estudantes nacionais)" */
export function feeLine(
  row: DegreeFees['rows'][number],
  t: TFunction<'browse'>,
  lang: Lang
): string {
  return t('degree_page.fees.faq_item', {
    amount: formatEur(row.amountEur, lang),
    period: t(`degree_page.fees.period.${row.period}`, {
      defaultValue: row.period
    }),
    student: t(`degree_page.fees.student.${row.studentType}`, {
      defaultValue: row.studentType
    })
  })
}

/**
 * The page's questions, answered only from data shown on the page. A question
 * with no data is not asked.
 */
export function buildFaq(
  t: TFunction<'browse'>,
  lang: Lang,
  ctx: FaqContext
): FaqItem[] {
  const items: FaqItem[] = []
  const { acronym } = ctx

  const { latest, previous } = latestGrades(ctx.admissions)
  if (latest) {
    items.push({
      question: t('degree_page.faq.last_grade_q', { acronym }),
      answer: previous
        ? t('degree_page.faq.last_grade_a_prev', {
            grade: formatGrade(latest.grade, lang),
            year: latest.year,
            previous: formatGrade(previous.grade, lang),
            previousYear: previous.year
          })
        : t('degree_page.faq.last_grade_a', {
            grade: formatGrade(latest.grade, lang),
            year: latest.year
          })
    })
  }

  const guide = ctx.admissions?.guide
  if (!ctx.isRetired && guide && guide.provas.length > 0) {
    const list = guide.provas.map((combo) => combo.join(' + ')).join('; ')
    items.push({
      question: t('degree_page.faq.exams_q', { acronym }),
      answer:
        guide.provas.length > 1
          ? t('degree_page.faq.exams_a_many', { list })
          : t('degree_page.faq.exams_a_one', { list })
    })
  }

  if (!ctx.isRetired && ctx.fees && ctx.fees.rows.length > 0) {
    items.push({
      question: t('degree_page.faq.fees_q', { acronym }),
      answer: t('degree_page.faq.fees_a', {
        year: formatSchoolYear(ctx.fees.schoolYear),
        list: ctx.fees.rows.map((row) => feeLine(row, t, lang)).join('; ')
      })
    })
  }

  const unemployment = ctx.outcomes?.unemployment
  if (ctx.outcomes && unemployment) {
    const params = {
      acronym,
      rate: formatPct(unemployment.rate, lang),
      edition: ctx.outcomes.edition
    }
    items.push({
      question: t('degree_page.faq.unemployment_q', { acronym }),
      answer:
        unemployment.national !== null
          ? t('degree_page.faq.unemployment_a_national', {
              ...params,
              national: formatPct(unemployment.national, lang)
            })
          : t('degree_page.faq.unemployment_a', params)
    })
  }

  const heaviest = ctx.highlights?.heaviest[0]
  if (heaviest) {
    items.push({
      question: t('degree_page.faq.heaviest_q', { acronym }),
      answer: t('degree_page.faq.heaviest_a', {
        course: heaviest.name,
        label: ctx
          .workloadLabel(Number(heaviest.averageWorkload))
          .toLowerCase(),
        count: Number(heaviest.totalFeedbackCount),
        n: formatNumber(Number(heaviest.totalFeedbackCount), lang)
      })
    })
  }

  return items
}
