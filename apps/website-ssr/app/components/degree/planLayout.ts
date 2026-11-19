import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import type {
  DegreePlanData,
  PlanEntry,
  PlanItem
} from '~/lib/degreePlan.server'
import type { AcademicTermInfo } from '../course/courseSections'

/**
 * How a curricular plan is laid out, shared by the degree page's plan
 * (`CurricularPlan`, an overview) and the course browser (`PlanCourseList`,
 * the same plan opened up with ratings and search), so both read a degree the
 * same way: years as rows, a column per semester, choices as pools.
 */

/** ECTS a year is meant to hold: 60, the last year what's left of the degree */
export const ECTS_PER_YEAR = 60

export interface PlanRow {
  year: number
  items: PlanItem[]
}

/** An item open to more than one year shows in each; this is where it's open */
export const spansYears = (item: PlanItem) => item.yearTo > item.yearFrom

/** The items of one version of the plan (those of no version are in all) */
export const itemsOfVersion = (
  plan: DegreePlanData,
  versionId: number | null
) =>
  plan.items.filter(
    (item) => item.versionId === null || item.versionId === versionId
  )

/**
 * One row per year with items. An item open to several years shows in each;
 * the year's own items first, then those it shares with other years.
 */
export function planRows(items: PlanItem[]): PlanRow[] {
  const lastYear = Math.max(0, ...items.map((item) => item.yearTo))
  const rows: PlanRow[] = []
  for (let year = 1; year <= lastYear; year++) {
    const inYear = items.filter(
      (item) => item.yearFrom <= year && year <= item.yearTo
    )
    const list = [
      ...inYear.filter((item) => !spansYears(item)),
      ...inYear.filter(spansYears)
    ]
    if (list.length > 0) rows.push({ year, items: list })
  }
  return rows
}

/**
 * Where an item draws: its term, the column (lane) that term draws in, and
 * whether it is year-long. A sub-term (P1, P2) draws in its parent semester's
 * column; a year-long course (FMDUL's "Anual") is no column, it gets its own
 * group under them.
 */
export function planTerms(academicTerms: AcademicTermInfo[]) {
  const termsById = new Map(academicTerms.map((term) => [term.id, term]))
  const termOf = (item: PlanItem) =>
    item.termId === null ? null : (termsById.get(item.termId) ?? null)
  const isAnnual = (item: PlanItem) => termOf(item)?.standardTerm === 'annual'
  const laneOf = (item: PlanItem) => {
    const term = termOf(item)
    if (!term || term.standardTerm === 'annual') return null
    return term.parentId !== null
      ? (termsById.get(term.parentId) ?? term)
      : term
  }
  /** The plan's columns, in calendar order */
  const lanesOf = (items: PlanItem[]) =>
    [
      ...new Map(
        items
          .map(laneOf)
          .filter((term): term is AcademicTermInfo => term !== null)
          .map((term) => [term.id, term])
      ).values()
    ].sort((a, b) => a.startTick - b.startTick)
  return { termsById, termOf, isAnnual, laneOf, lanesOf }
}

/** Entries under their group headings, keeping the order they come in. */
export function groupEntries<T extends PlanEntry>(entries: T[]) {
  const groups: { label: string | null; entries: T[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.label === entry.group) last.entries.push(entry)
    else groups.push({ label: entry.group, entries: [entry] })
  }
  return groups
}

/** The plan's wording: numbers, years and what a pool asks for */
export function usePlanText() {
  const { t } = useTranslation('browse')
  const lang = useLang()

  const fmt = (n: number) =>
    String(Math.round(n * 10) / 10).replace('.', lang === 'pt' ? ',' : '.')

  const yearLabel = (year: number) => t('degree_page.plan.year_one', { year })

  /**
   * "1.º ou 2.º ano", after the name of an item shown in several years. One
   * bigger than a year (FLUL's 120 ECTS of Opções over years 2 and 3) is spread
   * across them, not taken in one: "2.º e 3.º ano".
   */
  const yearsNote = (item: PlanItem) => {
    const span = item.yearTo - item.yearFrom
    const spread = item.ects > ECTS_PER_YEAR
    if (span === 1)
      return t(
        spread ? 'degree_page.plan.year_and' : 'degree_page.plan.year_or',
        { from: item.yearFrom, to: item.yearTo }
      )
    if (span === 2)
      return t(
        spread
          ? 'degree_page.plan.year_three_and'
          : 'degree_page.plan.year_three',
        { a: item.yearFrom, b: item.yearFrom + 1, c: item.yearTo }
      )
    return t('degree_page.plan.year_range', {
      from: item.yearFrom,
      to: item.yearTo
    })
  }

  /** "12 ECTS · 1 de 9": what a pool asks for */
  const poolSub = (item: PlanItem) => {
    const ects =
      item.ectsMin !== null && item.ectsMax !== null
        ? `${fmt(item.ectsMin)}–${fmt(item.ectsMax)}`
        : fmt(item.ects)
    let count = ''
    if (item.coursesMin !== null) {
      const max = item.coursesMax ?? item.coursesMin
      count =
        item.coursesMin === 1 && max === 1 && item.options.length > 1
          ? t('degree_page.plan.pool_one_of', { count: item.options.length })
          : t('degree_page.plan.pool_courses', {
              count: max,
              value:
                item.coursesMin === max
                  ? String(max)
                  : `${item.coursesMin}–${max}`
            })
    }
    return [t('degree_page.plan.ects', { value: ects }), count]
      .filter(Boolean)
      .join(' · ')
  }

  return { fmt, yearLabel, yearsNote, poolSub }
}
