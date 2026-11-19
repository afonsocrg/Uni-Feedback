import { Markdown } from '@uni-feedback/ui'
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang, useTermLabel } from '~/hooks'
import type {
  DegreePlanData,
  PlanEntry,
  PlanItem,
  PlanTrack
} from '~/lib/degreePlan.server'
import { cn } from '~/utils'
import { analytics } from '~/utils/analytics'
import { getCoursePath } from '~/utils/i18n-routes'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { ToggleChip } from '../common/ToggleChip'
import type { AcademicTermInfo } from '../course/courseSections'
import type { DegreeTrack } from './DegreeSections'

/**
 * The degree page's curricular plan (prds/curricular_plan.md, "What the
 * overview shows"): what the degree asks of a student, drawn from the plan
 * tables (0064) rather than from course offerings.
 *
 * Rows are years. An item open to several years ("Opções livres", 1.º ou 2.º
 * ano) shows in each of them, noted with its years: a student reading the plan
 * asks what they can take in a given year. The year's ECTS then cap at that
 * year's share of the degree (yearTotals), so the years still add up to it. A
 * row splits into one column per semester when its items have one. A block's width is its
 * ECTS: a semester column holds 15 ECTS per line, a row without columns 30, so a
 * 6 ECTS course is the same width everywhere. Courses are solid and link to
 * their page; pools (a choice) are dashed and open in place, under their row,
 * to their description and options. Items with no semester in a split row sit
 * under the columns as "Sem semestre fixo" (a pool taken in either semester, a
 * course in rotation). Tracks (areas, Majors, Minors, paths) are a list below.
 *
 * The plans were drafted from the faculties' pages and are checked by hand over
 * time, so the section ends asking for corrections.
 */

/**
 * How the plan draws: 'list' (each semester a list of courses, two columns on
 * desktop) or 'blocks' (a grid of cards whose width is their ECTS). Blocks were
 * the first design (prds/curricular_plan.md); kept to go back to.
 */
const PLAN_LAYOUT = 'list' as 'list' | 'blocks'
const LANE_ECTS_PER_LINE = 15
/** Plan texts are markdown; a one-line summary inside a button takes it plain */
const plainText = (markdown: string) =>
  markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*|__/g, '')
const ROW_ECTS_PER_LINE = 30

interface Row {
  year: number
  items: PlanItem[]
}

/** An item open to more than one year shows in each; this is where it's open */
const spansYears = (item: PlanItem) => item.yearTo > item.yearFrom

/**
 * The pools that start open: a choice that is all its year holds (Min-SC's
 * 2nd year, "Opções"; every year of a plan that is one choice), where a closed
 * pool would only be a tap to reach the only list there is. It stays a pool,
 * so a long one (FLUL's Opções) can still be closed.
 */
const lonePoolKeys = (plan: DegreePlanData, versionId: number | null) => {
  const items = plan.items.filter(
    (item) => item.versionId === null || item.versionId === versionId
  )
  const keys = new Set<string>()
  const lastYear = Math.max(0, ...items.map((item) => item.yearTo))
  for (let year = 1; year <= lastYear; year++) {
    const inYear = items.filter(
      (item) => item.yearFrom <= year && year <= item.yearTo
    )
    if (inYear.length === 1 && inYear[0].kind === 'pool')
      keys.add(`${year}:${inYear[0].id}`)
  }
  return keys
}

/** ECTS a year is meant to hold: 60, the last year what's left of the degree */
const ECTS_PER_YEAR = 60

/** "Todas as cadeiras", on the plan section's title line */
export function PlanCoursesLink({
  coursesPath,
  track
}: {
  coursesPath: string
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  return (
    <Link
      to={coursesPath}
      onClick={() => {
        if (track.facultySlug && track.degreeSlug)
          analytics.discovery.degreeCoursesCtaClicked({
            facultySlug: track.facultySlug,
            degreeSlug: track.degreeSlug,
            surface: 'plan_section'
          })
      }}
      className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
    >
      {t('degree_page.plan_all_courses')}
      <ArrowRight aria-hidden="true" className="size-3.5" />
    </Link>
  )
}

export function CurricularPlan({
  plan,
  academicTerms,
  degreeEcts,
  track
}: {
  plan: DegreePlanData
  academicTerms: AcademicTermInfo[]
  /** The degree's ECTS (null for a minor), to cap each year's total */
  degreeEcts: number | null
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const termLabel = useTermLabel()
  const [versionId, setVersionId] = useState<number | null>(
    plan.versions[0]?.id ?? null
  )
  // A pool shows once per year it's open to: the key is "year:itemId", so
  // opening it in one year doesn't unfold its copy in the next. Any number can
  // be open at once, to read several choices side by side.
  const [openPools, setOpenPools] = useState<Set<string>>(() =>
    lonePoolKeys(plan, plan.versions[0]?.id ?? null)
  )
  const poolKey = (year: number, item: PlanItem) => `${year}:${item.id}`
  // Years start collapsed, so the plan opens as a short list of years to skim
  // (some plans run to six years and dozens of tracks, and the sections after
  // it shouldn't sit behind all of that). Any number can be open at once.
  const [openYears, setOpenYears] = useState<Set<string>>(new Set())

  const fmt = (n: number) =>
    String(Math.round(n * 10) / 10).replace('.', lang === 'pt' ? ',' : '.')
  const slugs =
    track.facultySlug && track.degreeSlug
      ? { facultySlug: track.facultySlug, degreeSlug: track.degreeSlug }
      : null

  const termsById = useMemo(
    () => new Map(academicTerms.map((term) => [term.id, term])),
    [academicTerms]
  )
  /** The column a term draws in: its parent semester for a sub-term (P1, P2) */
  const termOfItem = (item: PlanItem) =>
    item.termId === null ? null : (termsById.get(item.termId) ?? null)
  /** A year-long course (FMDUL's "Anual") is no column: it gets its own group */
  const isAnnual = (item: PlanItem) =>
    termOfItem(item)?.standardTerm === 'annual'
  const laneOf = (item: PlanItem) => {
    const term = termOfItem(item)
    if (!term || term.standardTerm === 'annual') return null
    return term.parentId !== null
      ? (termsById.get(term.parentId) ?? term)
      : term
  }

  const items = plan.items.filter(
    (item) => item.versionId === null || item.versionId === versionId
  )
  const lanes = [
    ...new Map(
      items
        .map(laneOf)
        .filter((term): term is AcademicTermInfo => term !== null)
        .map((term) => [term.id, term])
    ).values()
  ].sort((a, b) => a.startTick - b.startTick)

  const rows = useMemo(() => {
    const lastYear = Math.max(0, ...items.map((item) => item.yearTo))
    const byYear: Row[] = []
    for (let year = 1; year <= lastYear; year++) {
      const inYear = items.filter(
        (item) => item.yearFrom <= year && year <= item.yearTo
      )
      // The year's own items first, then those it shares with other years
      const list = [
        ...inYear.filter((item) => !spansYears(item)),
        ...inYear.filter(spansYears)
      ]
      if (list.length > 0) byYear.push({ year, items: list })
    }
    return byYear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, versionId])

  /**
   * Each year's ECTS. Its own items count in full; items it shares with other
   * years count up to the year's share of the degree (60, the last year what's
   * left), so "1.º ou 2.º ano" pools don't count twice and the years add up to
   * the degree. A minor (no degree ECTS, or 18 over two years) has no 60 ECTS
   * years to share out: a year with shared items reads "up to" what it holds.
   */
  const yearTotals = useMemo(() => {
    const totals = new Map<number, { value: number; upTo: boolean }>()
    const planTotal = items.reduce((sum, item) => sum + item.ects, 0)
    const lastYear = Math.max(0, ...items.map((item) => item.yearTo))
    const byShares =
      degreeEcts !== null && degreeEcts > ECTS_PER_YEAR * (lastYear - 1)
    let left = degreeEcts ?? 0
    for (let year = 1; year <= lastYear; year++) {
      const own = items
        .filter((item) => item.yearFrom === year && item.yearTo === year)
        .reduce((sum, item) => sum + item.ects, 0)
      const shared = items
        .filter(
          (item) =>
            spansYears(item) && item.yearFrom <= year && year <= item.yearTo
        )
        .reduce((sum, item) => sum + item.ects, 0)
      const share = Math.min(ECTS_PER_YEAR, Math.max(left, 0))
      left -= share
      if (shared === 0) totals.set(year, { value: own, upTo: false })
      else if (byShares)
        totals.set(year, {
          value: Math.max(own, Math.min(share, own + shared)),
          upTo: false
        })
      else
        totals.set(year, {
          value: Math.min(own + shared, planTotal),
          upTo: true
        })
    }
    return totals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, versionId, degreeEcts])
  const yearEcts = (row: Row) => {
    const total = yearTotals.get(row.year) ?? { value: 0, upTo: false }
    return t(
      total.upTo ? 'degree_page.plan.ects_up_to' : 'degree_page.plan.ects',
      { value: fmt(total.value) }
    )
  }

  const yearLabel = (row: Row) =>
    t('degree_page.plan.year_one', { year: row.year })
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

  const trackCourseClick = (
    courseId: number,
    surface: 'block' | 'pool_option' | 'track'
  ) => {
    if (slugs)
      analytics.discovery.degreePlanCourseClicked({
        ...slugs,
        courseId,
        surface
      })
  }

  const groupToggled = (
    surface: 'pool' | 'track',
    group: string,
    expanded: boolean
  ) => {
    if (slugs)
      analytics.discovery.degreePlanOptionGroupToggled({
        ...slugs,
        surface,
        group,
        expanded
      })
  }

  const togglePool = (year: number, item: PlanItem) => {
    const key = poolKey(year, item)
    const isOpen = openPools.has(key)
    setOpenPools((prev) => {
      const next = new Set(prev)
      if (isOpen) next.delete(key)
      else next.add(key)
      return next
    })
    if (!isOpen && slugs)
      analytics.discovery.degreePlanPoolOpened({
        ...slugs,
        itemId: item.id,
        year,
        label: item.label ?? '',
        optionCount: item.options.length
      })
  }
  /** "P1 · 3 ECTS": the sub-term, when the item has one, and the size */
  const sizeOf = (item: PlanItem) => {
    const term = item.termId === null ? null : termsById.get(item.termId)
    const ects = t('degree_page.plan.ects', { value: fmt(item.ects) })
    return term && term.parentId !== null
      ? `${termLabel(term, 'short')} · ${ects}`
      : ects
  }
  const nameOf = (item: PlanItem) => item.course?.name ?? item.label ?? ''
  /** Fixed courses first, then the choices */
  const ordered = (list: PlanItem[]) => [
    ...list.filter((item) => item.kind === 'course'),
    ...list.filter((item) => item.kind === 'pool')
  ]

  // Desktop: a block per item, its width the ECTS, with the full name (students
  // browsing a plan for the first time don't know the acronyms, which stay as a
  // hint). A line of blocks is as tall as its longest name.
  const block = (year: number, item: PlanItem, perLine: number) => {
    const width = `${Math.min(item.ects / perLine, 1) * 100}%`
    const name = nameOf(item)

    if (item.kind === 'pool') {
      const isOpen = openPools.has(poolKey(year, item))
      return (
        <div key={item.id} className="flex min-w-28 p-0.5" style={{ width }}>
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => togglePool(year, item)}
            className={cn(
              'flex min-h-16 w-full cursor-pointer flex-col justify-start gap-0.5 rounded-md border-[1.5px] border-dashed px-2 py-1.5 text-left transition-colors',
              isOpen
                ? 'border-solid border-primaryBlue bg-primary/5'
                : 'border-muted-foreground/50 bg-card hover:bg-muted'
            )}
          >
            <span className="flex items-start gap-1 text-xs font-medium leading-snug text-foreground">
              <span className="line-clamp-3">{name}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'mt-0.5 size-3 shrink-0 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </span>
            <span className="mt-auto text-[11px] tabular-nums text-muted-foreground">
              {poolSub(item)}
            </span>
          </button>
        </div>
      )
    }

    const body = (
      <>
        <span className="line-clamp-3 hyphens-auto text-xs font-medium leading-snug text-foreground">
          {name}
        </span>
        <span className="mt-auto flex items-baseline justify-between gap-2 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
          <span className="whitespace-nowrap">{sizeOf(item)}</span>
        </span>
      </>
    )
    const className =
      'flex min-h-16 w-full flex-col justify-start rounded-md border border-primaryBlue/25 bg-primary/10 px-2 py-1.5'
    return (
      <div key={item.id} className="flex min-w-28 p-0.5" style={{ width }}>
        {item.course ? (
          <Link
            to={getCoursePath(lang, item.course.id)}
            title={`${name} · ${sizeOf(item)}`}
            onClick={() => trackCourseClick(item.course!.id, 'block')}
            className={cn(className, 'transition-colors hover:bg-primary/20')}
          >
            {body}
          </Link>
        ) : (
          <div className={className} title={`${name} · ${sizeOf(item)}`}>
            {body}
          </div>
        )}
      </div>
    )
  }

  const flow = (year: number, list: PlanItem[], perLine: number) => (
    <div className="flex flex-wrap items-stretch">
      {ordered(list).map((item) => block(year, item, perLine))}
    </div>
  )

  const poolPanel = (year: number, item: PlanItem) => (
    <PoolPanel
      item={item}
      onClose={() => togglePool(year, item)}
      onCourseClick={(id) => trackCourseClick(id, 'pool_option')}
      fmt={fmt}
    />
  )

  // Phone: a 6 ECTS block is too narrow for a name, so a semester is a list
  // (name and ECTS), and a choice opens right under its own row
  const listRows = (year: number, list: PlanItem[]) => (
    <ul>
      {ordered(list).map((item) => {
        const isPool = item.kind === 'pool'
        const isOpen = openPools.has(poolKey(year, item))
        const content = (
          <>
            {/* A closed choice reads as secondary (a slot to fill, not a
                course): gray, darkening on hover and once open */}
            <span
              className={cn(
                'flex min-w-0 items-baseline gap-1 text-sm',
                isPool && !isOpen
                  ? 'text-muted-foreground transition-colors group-hover:text-foreground'
                  : 'text-foreground',
                // A course links to its page: the site's link look on hover
                !isPool &&
                  item.course &&
                  'underline-offset-2 transition-colors group-hover:text-primaryBlue group-hover:underline'
              )}
            >
              {/* A choice opens like a disclosure: chevron first, pointing
                  right, then down once open */}
              {isPool && (
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 shrink-0 self-center text-muted-foreground transition-transform',
                    isOpen && 'rotate-90'
                  )}
                />
              )}
              <span className="min-w-0">
                {nameOf(item)}
                {spansYears(item) && (
                  <span className="ml-1.5 text-xs italic text-muted-foreground">
                    ({yearsNote(item)})
                  </span>
                )}
              </span>
            </span>
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
              {isPool ? poolSub(item) : sizeOf(item)}
            </span>
          </>
        )
        const rowClass =
          'grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2 text-left'
        return (
          <li key={item.id} className="border-b border-border last:border-b-0">
            {isPool ? (
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => togglePool(year, item)}
                className={cn(rowClass, 'group cursor-pointer')}
              >
                {content}
              </button>
            ) : item.course ? (
              <Link
                to={getCoursePath(lang, item.course.id)}
                onClick={() => trackCourseClick(item.course!.id, 'block')}
                // No hover on phones: a light flash confirms the tap
                className={cn(rowClass, 'group active:bg-muted')}
              >
                {content}
              </Link>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
            {/* The row itself unfolds: its description and options, indented */}
            {isPool && isOpen && (
              <div className="pb-2 pl-4">
                {item.description && (
                  <div className="pb-1 text-xs text-muted-foreground">
                    <Markdown>{item.description}</Markdown>
                  </div>
                )}
                {item.options.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto overscroll-contain">
                    <EntryList
                      entries={item.options}
                      fmt={fmt}
                      onCourseClick={(id) =>
                        trackCourseClick(id, 'pool_option')
                      }
                      onGroupToggle={(group, expanded) =>
                        groupToggled('pool', group, expanded)
                      }
                      compact
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('degree_page.plan.pool_options_unknown')}
                  </p>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )

  const laneHead = (label: string) => (
    <div className="px-1 pb-1 text-[11px] font-medium text-muted-foreground">
      {label}
    </div>
  )
  const semesterHead = (label: string) => (
    <div className="border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  )

  /**
   * A plan that is one choice and nothing else (an IST Minor: "3 de 4
   * cadeiras" over years 1–2) skips the years: its pool is the plan.
   */
  const soloPool =
    items.length === 1 && items[0].kind === 'pool' ? items[0] : null

  const toggleYear = (row: Row) => {
    const key = String(row.year)
    const isOpen = openYears.has(key)
    setOpenYears((prev) => {
      const next = new Set(prev)
      if (isOpen) next.delete(key)
      else next.add(key)
      return next
    })
    if (slugs)
      analytics.discovery.degreePlanYearToggled({
        ...slugs,
        yearFrom: row.year,
        yearTo: row.year,
        expanded: !isOpen
      })
  }

  const listRow = (row: Row, i: number) => {
    const key = String(row.year)
    const useLanes =
      lanes.length > 0 && row.items.some((item) => laneOf(item) !== null)
    const loose = useLanes
      ? row.items.filter((item) => laneOf(item) === null)
      : row.items
    const isOpen = openYears.has(key)
    return (
      <div
        key={key}
        className={cn('border-t border-border py-3', i === 0 && 'border-t-0')}
      >
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggleYear(row)}
          className="flex w-full cursor-pointer items-baseline justify-between gap-3 text-left"
        >
          {/* Chevron first, like every other row that opens */}
          <span className="flex items-center gap-1 text-base font-semibold text-foreground">
            <ChevronRight
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                isOpen && 'rotate-90'
              )}
            />
            {yearLabel(row)}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {yearEcts(row)}
          </span>
        </button>
        <div className={cn('mt-3 min-w-0', !isOpen && 'hidden')}>
          {useLanes && (
            <div className="flex flex-col gap-8 md:flex-row md:gap-6">
              {lanes.map((lane) => {
                const inLane = row.items.filter(
                  (item) => laneOf(item)?.id === lane.id
                )
                return (
                  // An empty semester keeps its column on desktop, so the
                  // semesters line up from year to year
                  <div
                    key={lane.id}
                    className={cn(
                      'min-w-0 flex-1',
                      inLane.length === 0 && 'hidden md:block'
                    )}
                  >
                    {semesterHead(termLabel(lane, 'long'))}
                    {listRows(row.year, inLane)}
                  </div>
                )
              })}
            </div>
          )}
          {/* Under the semesters: year-long courses, then any with no term */}
          {[
            {
              list: loose.filter(isAnnual),
              label: (() => {
                const term = loose
                  .map(termOfItem)
                  .find((x) => x?.standardTerm === 'annual')
                return term ? termLabel(term, 'long') : ''
              })()
            },
            {
              list: loose.filter((item) => !isAnnual(item)),
              label: t('degree_page.plan.no_fixed_term')
            }
          ]
            .filter((group) => group.list.length > 0)
            .map((group) => (
              <div key={group.label} className={cn(useLanes && 'mt-8 md:mt-5')}>
                {useLanes && semesterHead(group.label)}
                {listRows(row.year, group.list)}
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {plan.description && (
        <div className="text-sm text-foreground">
          <Markdown>{plan.description}</Markdown>
        </div>
      )}

      <div className="space-y-5">
        {plan.versions.length > 1 && (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={t('degree_page.plan.version_label')}
          >
            <span className="text-xs font-medium text-muted-foreground">
              {t('degree_page.plan.version_label')}
            </span>
            {plan.versions.map((version) => (
              <ToggleChip
                key={version.id}
                label={version.name}
                isActive={versionId === version.id}
                onClick={() => {
                  setVersionId(version.id)
                  setOpenPools(lonePoolKeys(plan, version.id))
                  // Open the years where the versions differ (FDUL's turmas
                  // from the 2nd year on), so picking one shows the change
                  setOpenYears(
                    (prev) =>
                      new Set([
                        ...prev,
                        ...plan.items
                          .filter((item) => item.versionId !== null)
                          .flatMap((item) =>
                            Array.from(
                              { length: item.yearTo - item.yearFrom + 1 },
                              (_, k) => String(item.yearFrom + k)
                            )
                          )
                      ])
                  )
                  if (slugs)
                    analytics.discovery.degreePlanVersionSelected({
                      ...slugs,
                      versionId: version.id,
                      version: version.name
                    })
                }}
              />
            ))}
          </div>
        )}

        {soloPool ? (
          listRows(soloPool.yearFrom, [soloPool])
        ) : PLAN_LAYOUT === 'list' ? (
          <div>{rows.map(listRow)}</div>
        ) : (
          <div>
            {lanes.length > 0 && (
              <div className="hidden md:grid md:grid-cols-[6rem_minmax(0,1fr)]">
                <div />
                <div className="flex gap-2">
                  {lanes.map((lane) => (
                    <div key={lane.id} className="min-w-0 flex-1">
                      {laneHead(termLabel(lane, 'long'))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rows.map((row, i) => {
              const useLanes =
                lanes.length > 0 &&
                row.items.some((item) => laneOf(item) !== null)
              const loose = useLanes
                ? row.items.filter((item) => laneOf(item) === null)
                : row.items
              // Blocks have room for one panel under the row: the first open
              const open = row.items.find((item) =>
                openPools.has(poolKey(row.year, item))
              )
              return (
                <Fragment key={row.year}>
                  <div
                    className={cn(
                      'grid grid-cols-1 border-t border-border py-2 md:grid-cols-[6rem_minmax(0,1fr)]',
                      i === 0 && 'border-t-0'
                    )}
                  >
                    <div className="pb-1 pr-3 text-sm font-semibold text-muted-foreground md:pt-2 md:text-right">
                      {yearLabel(row)}
                      <span className="ml-2 text-xs font-normal tabular-nums md:ml-0 md:block">
                        {yearEcts(row)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="hidden md:block">
                        {useLanes && (
                          <div className="flex gap-2">
                            {lanes.map((lane) => (
                              <div key={lane.id} className="min-w-0 flex-1">
                                {flow(
                                  row.year,
                                  row.items.filter(
                                    (item) => laneOf(item)?.id === lane.id
                                  ),
                                  LANE_ECTS_PER_LINE
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {loose.length > 0 && (
                          <div className={cn(useLanes && 'mt-2')}>
                            {useLanes &&
                              laneHead(t('degree_page.plan.no_fixed_term'))}
                            {flow(row.year, loose, ROW_ECTS_PER_LINE)}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 md:hidden">
                        {useLanes &&
                          lanes.map((lane) => {
                            const inLane = row.items.filter(
                              (item) => laneOf(item)?.id === lane.id
                            )
                            return (
                              inLane.length > 0 && (
                                <div key={lane.id}>
                                  {laneHead(termLabel(lane, 'long'))}
                                  {listRows(row.year, inLane)}
                                </div>
                              )
                            )
                          })}
                        {loose.length > 0 && (
                          <div>
                            {useLanes &&
                              laneHead(t('degree_page.plan.no_fixed_term'))}
                            {listRows(row.year, loose)}
                          </div>
                        )}
                      </div>
                      {/* Desktop: under the row of blocks; phones open it in the list */}
                      {open && (
                        <div className="hidden md:block">
                          {poolPanel(row.year, open)}
                        </div>
                      )}
                    </div>
                  </div>
                </Fragment>
              )
            })}
          </div>
        )}

        {plan.tracks.length > 0 && (
          <Tracks
            tracks={plan.tracks}
            rules={plan.trackRules}
            fmt={fmt}
            onOpen={(trackItem) => {
              if (slugs)
                analytics.discovery.degreePlanTrackOpened({
                  ...slugs,
                  trackId: trackItem.id,
                  kind: trackItem.kind,
                  track: trackItem.name
                })
            }}
            onKindToggle={(kind, expanded) => {
              if (slugs)
                analytics.discovery.degreePlanTracksToggled({
                  ...slugs,
                  kind,
                  expanded
                })
            }}
            onCourseClick={(id) => trackCourseClick(id, 'track')}
            onGroupToggle={(group, expanded) =>
              groupToggled('track', group, expanded)
            }
          />
        )}
        {/* At the end of the plan, after what it would correct */}
        {/* Every plan shows, checked by hand or not: anyone can fix it */}
        <ReportErrorNote
          surface="degree_plan"
          pageName={`${t('degree_page.sections.plan')} ${track.pageName}`}
          facultySlug={track.facultySlug}
          degreeSlug={track.degreeSlug}
          align="left"
          text={t('degree_page.plan.correction_text')}
          linkText={t('degree_page.plan.correction_link')}
        />
      </div>
    </div>
  )
}

/**
 * A course with a page links to it; one without is just its name. `note` is a
 * muted aside after the name ("(obrigatória)").
 */
function EntryName({
  entry,
  onCourseClick,
  note
}: {
  entry: PlanEntry
  onCourseClick: (courseId: number) => void
  note?: string | null
}) {
  const lang = useLang()
  return (
    <span className="min-w-0">
      {entry.course ? (
        <Link
          to={getCoursePath(lang, entry.course.id)}
          onClick={() => onCourseClick(entry.course!.id)}
          className="text-foreground hover:text-primaryBlue hover:underline"
        >
          {entry.course.name}
        </Link>
      ) : (
        <span className="text-foreground">{entry.name}</span>
      )}
      {note && (
        <span className="ml-1.5 text-xs italic text-muted-foreground">
          ({note})
        </span>
      )}
    </span>
  )
}

/** Entries under their group headings, keeping the order they come in. */
function groupEntries<T extends PlanEntry>(entries: T[]) {
  const groups: { label: string | null; entries: T[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.label === entry.group) last.entries.push(entry)
    else groups.push({ label: entry.group, entries: [entry] })
  }
  return groups
}

/**
 * When a grouped list folds its groups, so the group names are the list to
 * scan and a group opens on a tap: a long list (FLUL's Opções, 37 Majors and
 * Minors, 700 courses), or a shorter one split in several groups that are
 * alternatives (LT's "Cultura da Língua A" by language, MEEC's areas), where a
 * student only reads their own. Two groups of a short list (NOVA IMS's
 * "Optativas") stay open. A group of one course never folds: it would hide a
 * single row behind a tap.
 */
const FOLD_GROUPS_OVER = 20
const FOLD_MANY_GROUPS = { over: 10, groups: 3 }

function EntryList<T extends PlanEntry>({
  entries,
  fmt,
  onCourseClick,
  onGroupToggle,
  noteOf,
  compact = false
}: {
  entries: T[]
  fmt: (n: number) => string
  onCourseClick: (courseId: number) => void
  onGroupToggle?: (group: string, expanded: boolean) => void
  noteOf?: (entry: T) => string | null
  /** Name and ECTS only, like the phone list's own rows */
  compact?: boolean
}) {
  const { t } = useTranslation('browse')
  const groups = groupEntries(entries)
  const labelled = groups.filter((group) => group.label).length
  const folds =
    labelled > 1 &&
    (entries.length > FOLD_GROUPS_OVER ||
      (entries.length > FOLD_MANY_GROUPS.over &&
        labelled >= FOLD_MANY_GROUPS.groups))
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())
  const toggleGroup = (gi: number, label: string) => {
    const isOpen = openGroups.has(gi)
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (isOpen) next.delete(gi)
      else next.add(gi)
      return next
    })
    onGroupToggle?.(label, !isOpen)
  }
  return (
    <ul className="text-sm">
      {groups.map((group, gi) => {
        const foldsGroup =
          folds && group.label !== null && group.entries.length > 1
        const isOpen = !foldsGroup || openGroups.has(gi)
        return (
          <Fragment key={gi}>
            {group.label &&
              (foldsGroup ? (
                <li className="border-b border-border">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleGroup(gi, group.label!)}
                    className="group flex w-full cursor-pointer items-center gap-1 py-1.5 text-left text-sm"
                  >
                    <ChevronRight
                      aria-hidden="true"
                      className={cn(
                        'size-3.5 shrink-0 text-muted-foreground transition-transform',
                        isOpen && 'rotate-90'
                      )}
                    />
                    <span
                      className={cn(
                        'transition-colors group-hover:text-foreground',
                        isOpen ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {group.label} ({group.entries.length})
                    </span>
                  </button>
                </li>
              ) : folds ? (
                // A group of one among folded groups: its name as a row like
                // theirs (no chevron, nothing to open), its course under it
                <li className="flex items-center gap-1 border-b border-border py-1.5 text-sm text-foreground">
                  <span aria-hidden="true" className="size-3.5 shrink-0" />
                  {group.label} ({group.entries.length})
                </li>
              ) : (
                <li className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:pt-0">
                  {group.label}
                </li>
              ))}
            {isOpen &&
              group.entries.map((entry, i) => {
                const ects = entry.ects ?? entry.course?.ects ?? null
                return (
                  <li
                    key={i}
                    className={cn(
                      'grid items-baseline gap-3 border-b border-border py-1.5 last:border-b-0',
                      // Inside a folded group: indented under its name
                      folds && group.label && 'pl-4',
                      compact
                        ? 'grid-cols-[minmax(0,1fr)_auto]'
                        : 'grid-cols-[4.5rem_minmax(0,1fr)_auto]'
                    )}
                  >
                    {!compact && (
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {entry.course?.acronym ?? ''}
                      </span>
                    )}
                    <EntryName
                      entry={entry}
                      onCourseClick={onCourseClick}
                      note={noteOf?.(entry)}
                    />
                    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {ects !== null &&
                        t('degree_page.plan.ects', { value: fmt(ects) })}
                    </span>
                  </li>
                )
              })}
          </Fragment>
        )
      })}
    </ul>
  )
}

function PoolPanel({
  item,
  onClose,
  onCourseClick,
  fmt
}: {
  item: PlanItem
  onClose: () => void
  onCourseClick: (courseId: number) => void
  fmt: (n: number) => string
}) {
  const { t } = useTranslation('browse')
  return (
    <div className="mx-0.5 mb-1 mt-2 rounded-lg border-[1.5px] border-dashed border-primaryBlue bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{item.label}</p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {t('degree_page.plan.pool_close')}
        </button>
      </div>
      {item.description && (
        <div className="mt-1 text-sm text-muted-foreground">
          <Markdown>{item.description}</Markdown>
        </div>
      )}
      <div className="mt-3 max-h-72 overflow-y-auto overscroll-contain rounded-md bg-card px-3 py-2">
        {item.options.length > 0 ? (
          <EntryList
            entries={item.options}
            fmt={fmt}
            onCourseClick={onCourseClick}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('degree_page.plan.pool_options_unknown')}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * "(obrigatória)" marks the compulsory courses of a track only when it also
 * has optional ones: in a fully fixed track (ESPP's Políticas Públicas) every
 * row would carry it, and its rule already says so
 */
const marksMandatory = (track: PlanTrack) =>
  track.courses.some((c) => c.isMandatory) &&
  track.courses.some((c) => !c.isMandatory)

const KIND_ORDER: PlanTrack['kind'][] = [
  'specialization',
  'major',
  'minor',
  'path',
  'secondary'
]

function Tracks({
  tracks,
  rules,
  fmt,
  onOpen,
  onKindToggle,
  onCourseClick,
  onGroupToggle
}: {
  tracks: PlanTrack[]
  rules: string | null
  fmt: (n: number) => string
  onOpen: (track: PlanTrack) => void
  onKindToggle: (kind: PlanTrack['kind'], expanded: boolean) => void
  onCourseClick: (courseId: number) => void
  onGroupToggle: (group: string, expanded: boolean) => void
}) {
  const { t } = useTranslation('browse')
  const [open, setOpen] = useState<number | null>(null)
  // Each kind starts as one quiet row ("› Áreas de especialização (15)"): in
  // some degrees tracks are a mention on the diploma (MEIC), too niche to
  // list on a first look; where they shape the plan (Estudos Gerais, MEEC at
  // NOVA FCT) they are one tap away
  const [openKinds, setOpenKinds] = useState<Set<PlanTrack['kind']>>(new Set())
  const kinds = KIND_ORDER.filter((kind) =>
    tracks.some((track) => track.kind === kind)
  )
  const meta = (track: PlanTrack) =>
    [
      track.courses.length > 0 &&
        t('degree_page.plan.track_courses', { count: track.courses.length }),
      track.coursesMin !== null &&
        t('degree_page.plan.track_min_courses', { count: track.coursesMin }),
      track.ectsMin !== null &&
        t('degree_page.plan.track_min_ects', { value: fmt(track.ectsMin) })
    ]
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="space-y-1">
      {kinds.map((kind, ki) => {
        const isKindOpen = openKinds.has(kind)
        const count = tracks.filter((track) => track.kind === kind).length
        return (
          <div key={kind}>
            <h3>
              <button
                type="button"
                aria-expanded={isKindOpen}
                onClick={() => {
                  setOpenKinds((prev) => {
                    const next = new Set(prev)
                    if (isKindOpen) next.delete(kind)
                    else next.add(kind)
                    return next
                  })
                  onKindToggle(kind, !isKindOpen)
                }}
                className="group flex w-full cursor-pointer items-center gap-1 py-1.5 text-left text-sm"
              >
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-3.5 shrink-0 text-muted-foreground transition-transform',
                    isKindOpen && 'rotate-90'
                  )}
                />
                <span
                  className={cn(
                    'transition-colors group-hover:text-foreground',
                    isKindOpen ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {t(`degree_page.plan.tracks_kind.${kind}`)} ({count})
                </span>
              </button>
            </h3>
            {isKindOpen && (
              <div className="pb-3 pl-4">
                {/* The rule over the tracks, under the first kind (it covers all) */}
                {rules && ki === 0 && (
                  <div className="pb-2 text-sm text-muted-foreground">
                    <Markdown>{rules}</Markdown>
                  </div>
                )}
                <ul className="border-t border-border">
                  {tracks
                    .filter((track) => track.kind === kind)
                    .map((track) => {
                      const isOpen = open === track.id
                      return (
                        <li key={track.id} className="border-b border-border">
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => {
                              setOpen(isOpen ? null : track.id)
                              if (!isOpen) onOpen(track)
                            }}
                            className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 py-2.5 text-left"
                          >
                            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                              <ChevronRight
                                aria-hidden="true"
                                className={cn(
                                  'size-3.5 shrink-0 text-muted-foreground transition-transform',
                                  isOpen && 'rotate-90'
                                )}
                              />
                              {track.name}
                            </span>
                            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                              {meta(track)}
                            </span>
                            {track.description && !isOpen && (
                              <span className="col-span-2 line-clamp-1 text-sm text-muted-foreground">
                                {plainText(track.description)}
                              </span>
                            )}
                          </button>
                          {isOpen && (
                            <div className="space-y-2 pb-3">
                              {track.description && (
                                <div className="text-sm text-muted-foreground">
                                  <Markdown>{track.description}</Markdown>
                                </div>
                              )}
                              {track.rules && (
                                <div className="text-sm text-foreground">
                                  <Markdown>{track.rules}</Markdown>
                                </div>
                              )}
                              {track.courses.length > 0 && (
                                <EntryList
                                  entries={track.courses}
                                  fmt={fmt}
                                  onCourseClick={onCourseClick}
                                  onGroupToggle={onGroupToggle}
                                  // Same rows as the plan's own lists
                                  compact
                                  noteOf={
                                    marksMandatory(track)
                                      ? (entry) =>
                                          entry.isMandatory
                                            ? t(
                                                'degree_page.plan.track_mandatory'
                                              )
                                            : null
                                      : undefined
                                  }
                                />
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
