import { isDiscontinued } from '@uni-feedback/utils'
import type { TFunction } from 'i18next'
import type { Lang } from '~/i18n/config'
import type { CourseWithFeedback } from '../course/types'
import type {
  AdmissionRoundView,
  DegreeAdmissions,
  DegreeFees,
  DegreeOutcomes
} from './pageTypes'

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

/**
 * Stable keys for the generated questions. A curated FAQ row (`degree_faqs`)
 * with the same `topic` replaces the generated one.
 */
export type FaqTopic =
  | 'admission_grade'
  | 'entry_exams'
  | 'fees'
  | 'unemployment'
  | 'heaviest_course'

export interface FaqItem {
  question: string
  answer: string
  /** Generated questions always have one; curated rows may */
  topic: string | null
  /** Curated answers are markdown; generated ones plain text */
  isMarkdown: boolean
}

/** A reviewed `degree_faqs` row, in the page's language */
export interface CuratedFaq {
  topic: string | null
  question: string
  answer: string
}

/**
 * The FAQ the page shows: curated questions first, in their order, then the
 * generated ones whose topic no curated question already covers.
 */
export function mergeFaq(
  curated: CuratedFaq[],
  generated: FaqItem[]
): FaqItem[] {
  const covered = new Set(
    curated.map((c) => c.topic).filter((topic): topic is string => !!topic)
  )
  return [
    ...curated.map((c) => ({
      question: c.question,
      answer: c.answer,
      topic: c.topic,
      isMarkdown: true
    })),
    ...generated.filter((item) => !item.topic || !covered.has(item.topic))
  ]
}

/**
 * Markdown to plain text for structured data (FAQPage answers): links keep
 * their text, emphasis and heading marks go.
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
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
      topic: 'admission_grade' satisfies FaqTopic,
      isMarkdown: false,
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
      topic: 'entry_exams' satisfies FaqTopic,
      isMarkdown: false,
      question: t('degree_page.faq.exams_q', { acronym }),
      answer:
        guide.provas.length > 1
          ? t('degree_page.faq.exams_a_many', { list })
          : t('degree_page.faq.exams_a_one', { list })
    })
  }

  if (!ctx.isRetired && ctx.fees && ctx.fees.rows.length > 0) {
    items.push({
      topic: 'fees' satisfies FaqTopic,
      isMarkdown: false,
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
      share: formatPct(Math.round((100 - unemployment.rate) * 10) / 10, lang),
      edition: ctx.outcomes.edition
    }
    items.push({
      topic: 'unemployment' satisfies FaqTopic,
      isMarkdown: false,
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
      topic: 'heaviest_course' satisfies FaqTopic,
      isMarkdown: false,
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

/** The round a student should look at: the open one, else the next to open. */
export function nextRound(
  rounds: AdmissionRoundView[]
): AdmissionRoundView | undefined {
  return (
    rounds.find((r) => r.status === 'open') ??
    rounds.find((r) => r.status === 'upcoming')
  )
}

/* Admission round dates: ISO calendar days, always formatted in UTC */

const DATE_LOCALES = { pt: 'pt-PT', en: 'en-GB' } as const

// ISO dates are calendar days: format them in UTC so no timezone shifts the day
const isoToDate = (iso: string) => new Date(`${iso}T00:00:00Z`)
// 'short' months are numeric in pt-PT ("11/11/2026"), so the formats use 'long'
const dayFormat = (lang: 'pt' | 'en') =>
  new Intl.DateTimeFormat(DATE_LOCALES[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })

export function formatIsoDay(iso: string, lang: 'pt' | 'en'): string {
  return dayFormat(lang).format(isoToDate(iso))
}

/** "25 nov" / "25 Nov": a timeline tick, where the year is implied. */
export function formatIsoShortDay(iso: string, lang: 'pt' | 'en'): string {
  const month = new Intl.DateTimeFormat(DATE_LOCALES[lang], {
    month: 'long',
    timeZone: 'UTC'
  })
    .format(isoToDate(iso))
    .slice(0, 3)
  return `${isoToDate(iso).getUTCDate()} ${month}`
}

/** "17 abr 2026": a date with an abbreviated month, for compact lists. */
export function formatIsoShortDate(iso: string, lang: 'pt' | 'en'): string {
  return `${formatIsoShortDay(iso, lang)} ${iso.slice(0, 4)}`
}

/**
 * A round's dates as one range with abbreviated months: "9–20 mar 2026",
 * "22 jun – 3 jul 2026", "25 nov 2026 – 6 jan 2027", or "until" / "from" with
 * only one end.
 */
export function formatIsoPeriod(
  opensOn: string | null,
  closesOn: string | null,
  lang: 'pt' | 'en',
  label: { until: (date: string) => string; from: (date: string) => string }
): string {
  if (opensOn && closesOn) {
    if (opensOn.slice(0, 4) !== closesOn.slice(0, 4)) {
      return `${formatIsoShortDate(opensOn, lang)} – ${formatIsoShortDate(closesOn, lang)}`
    }
    return `${formatIsoShortRange(opensOn, closesOn, lang, label)} ${closesOn.slice(0, 4)}`
  }
  if (closesOn) return label.until(formatIsoShortDate(closesOn, lang))
  if (opensOn) return label.from(formatIsoShortDate(opensOn, lang))
  return '–'
}

/**
 * A round's interval for a timeline label, year implied: "11–25 nov",
 * "25 nov – 6 jan", or "until" / "from" with only one end.
 */
export function formatIsoShortRange(
  opensOn: string | null,
  closesOn: string | null,
  lang: 'pt' | 'en',
  label: { until: (date: string) => string; from: (date: string) => string }
): string {
  if (opensOn && closesOn) {
    const [start, end] = [opensOn, closesOn].map((iso) =>
      formatIsoShortDay(iso, lang)
    )
    const sameMonth = opensOn.slice(0, 7) === closesOn.slice(0, 7)
    return sameMonth
      ? `${isoToDate(opensOn).getUTCDate()}–${end}`
      : `${start} – ${end}`
  }
  if (closesOn) return label.until(formatIsoShortDay(closesOn, lang))
  if (opensOn) return label.from(formatIsoShortDay(opensOn, lang))
  return '–'
}

/**
 * The provas de ingresso in one phrase for the Ingresso summary, from the
 * guide's combinations (each a list of exam names): the exam every
 * combination shares ("com Matemática A e outra prova de ingresso"), or how
 * many combinations there are. Null without provas.
 */
export function admissionProvasPhrase(
  provas: string[][],
  t: TFunction<'browse'>,
  lang: Lang
): string | null {
  const combos = provas.filter((combo) => combo.length > 0)
  if (combos.length === 0) return null
  if (combos.length === 1) {
    const [only] = combos
    if (only.length === 1) {
      return t('degree_page.admission_summary.provas_one', { exam: only[0] })
    }
    const list = new Intl.ListFormat(lang === 'pt' ? 'pt-PT' : 'en-GB', {
      type: 'conjunction'
    }).format(only)
    return t('degree_page.admission_summary.provas_all', { list })
  }
  const common = combos[0].filter((exam) =>
    combos.every((combo) => combo.includes(exam))
  )
  if (common.length === 1) {
    const exam = common[0]
    return combos.some((combo) => combo.length === 1)
      ? t('degree_page.admission_summary.provas_alone_or_pair', { exam })
      : t('degree_page.admission_summary.provas_common', { exam })
  }
  return t('degree_page.admission_summary.provas_combos', {
    count: combos.length
  })
}
