import { Markdown } from '@uni-feedback/ui'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTermLabel } from '~/hooks'
import type {
  DegreePlanData,
  PlanEntry,
  PlanItem
} from '~/lib/degreePlan.server'
import { cn, insensitiveMatch } from '~/utils'
import { InfoPopover } from '../common/InfoPopover'
import { CourseRow } from '../course/CourseTable'
import {
  compareCourses,
  yearAnchorId,
  type AcademicTermInfo,
  type SortOption
} from '../course/courseSections'
import type { CourseWithFeedback } from '../course/types'
import {
  groupEntries,
  itemsOfVersion,
  planRows,
  planTerms,
  spansYears,
  usePlanText
} from './planLayout'

/**
 * The course browser's listing when the degree has a curricular plan
 * (`/:faculty/:degree/cadeiras`): the degree page's plan opened up, with every
 * course's rating, workload and feedback count. Years are sections, each split
 * in a column per semester (side by side on desktop, stacked on phones). A
 * semester lists its fixed courses, then its pools, each pool a dashed box
 * whose options scroll inside it and whose rule ("como funciona") sits behind
 * a (?) rather than on the page.
 *
 * Only what can be rated is listed: a pool with no option that has a course
 * page here (MEIC's extracurricular activities, FLUL's options at other
 * schools) is left to the degree page's plan. A fixed item with no page (a
 * dissertation) stays, as a plain row: it is what fills its semester.
 *
 * Browsing, a pool shows in every slot it's open to (FLUL's languages in both
 * semesters, MEIC's options in the 1st or 2nd year): each is a real choice in
 * that slot. A search or filter narrows the plan in place: rows that don't
 * match go, and so do pools and years left empty (a semester stays, with a
 * note, so the columns don't jump while typing). Filtering, a course shows once,
 * at its first slot, with "Também em …" naming the others: the student is
 * looking for one course, not for the plan's repeats.
 */

export interface PlanFilter {
  query: string
  /** A track's courses (MEIC's specialization, a FLUL Major) */
  trackCourseIds: Set<number> | null
  hasMandatoryExam: boolean | null
  /** true: the plan's fixed courses; false: its choices (pools) */
  fixed: boolean | null
}

interface ListedEntry {
  key: string
  course: CourseWithFeedback | null
  /** A course with no page here: its name (an option at another school) */
  name: string
  ects: number | null
  /** "Também em …", filtering only */
  alsoIn: string[]
  position: number
}

interface ListedPool {
  item: PlanItem
  groups: { label: string | null; entries: ListedEntry[] }[]
}

interface ListedSlot {
  key: string
  /** The column's heading: a semester, "Anual", "Sem semestre fixo" */
  heading: string | null
  /** A semester column (narrow on desktop) rather than a full-width group */
  isLane: boolean
  courses: ListedEntry[]
  pools: ListedPool[]
}

interface ListedYear {
  year: number
  lanes: ListedSlot[]
  loose: ListedSlot[]
}

export interface PlanListing {
  years: ListedYear[]
  /** Rows shown (a course repeated in several pools counts once filtering) */
  count: number
  filtering: boolean
  /** Every course the plan names, so the browser can list the others apart */
  planCourseIds: Set<number>
}

const entryKey = (entry: PlanEntry) =>
  entry.course ? `c${entry.course.id}` : `n${entry.name ?? ''}`

/**
 * Builds what `PlanCourseList` draws: the plan's slots in reading order (year,
 * semester columns, then year-long and unscheduled groups), each with the
 * entries that pass the filter, sorted, and numbered for `positionInList`.
 */
export function usePlanListing({
  plan,
  versionId,
  academicTerms,
  coursesById,
  filter,
  sortBy
}: {
  plan: DegreePlanData | null
  versionId: number | null
  academicTerms: AcademicTermInfo[]
  coursesById: Map<number, CourseWithFeedback>
  filter: PlanFilter
  sortBy: SortOption
}): PlanListing {
  const { t } = useTranslation('browse')
  const termLabel = useTermLabel()
  const { yearLabel } = usePlanText()

  return useMemo(() => {
    if (!plan)
      return { years: [], count: 0, filtering: false, planCourseIds: new Set() }
    const { termOf, isAnnual, laneOf, lanesOf } = planTerms(academicTerms)
    const items = itemsOfVersion(plan, versionId)
    const lanes = lanesOf(items)
    const rows = planRows(items)
    const query = filter.query.trim()
    const filtering =
      query.length > 0 ||
      filter.trackCourseIds !== null ||
      filter.hasMandatoryExam !== null ||
      filter.fixed !== null

    // The slots of the plan, before filtering: what "Também em" names
    type Slot = {
      key: string
      year: number
      label: string
      heading: string | null
      isLane: boolean
      items: PlanItem[]
    }
    const slots: Slot[] = []
    const lanesByYear = new Map<number, Slot[]>()
    const looseByYear = new Map<number, Slot[]>()
    for (const row of rows) {
      const useLanes =
        lanes.length > 0 && row.items.some((item) => laneOf(item) !== null)
      const yearSlots: Slot[] = []
      if (useLanes)
        for (const lane of lanes) {
          const slot: Slot = {
            key: `${row.year}:${lane.id}`,
            year: row.year,
            label: `${yearLabel(row.year)}, ${termLabel(lane, 'long')}`,
            heading: termLabel(lane, 'long'),
            isLane: true,
            items: row.items.filter((item) => laneOf(item)?.id === lane.id)
          }
          yearSlots.push(slot)
        }
      lanesByYear.set(row.year, yearSlots)
      const loose = useLanes
        ? row.items.filter((item) => laneOf(item) === null)
        : row.items
      const annualTerm = loose.map(termOf).find((term) => {
        return term?.standardTerm === 'annual'
      })
      const looseSlots: Slot[] = [
        {
          key: `${row.year}:annual`,
          year: row.year,
          label: yearLabel(row.year),
          heading:
            useLanes && annualTerm ? termLabel(annualTerm, 'long') : null,
          isLane: false,
          items: loose.filter(isAnnual)
        },
        {
          key: `${row.year}:loose`,
          year: row.year,
          label: yearLabel(row.year),
          heading: useLanes ? t('degree_page.plan.no_fixed_term') : null,
          isLane: false,
          items: loose.filter((item) => !isAnnual(item))
        }
      ].filter((slot) => slot.items.length > 0)
      looseByYear.set(row.year, looseSlots)
      slots.push(...yearSlots, ...looseSlots)
    }

    // Where each course sits in the plan, in reading order, and through which
    // item: a pool open to the 1st or 2nd year is one choice, already labelled
    // "(1.º ou 2.º ano)", not two places to name under each of its courses
    const slotsOf = new Map<string, { label: string; itemId: number }[]>()
    for (const slot of slots)
      for (const item of slot.items) {
        const entries: PlanEntry[] =
          item.kind === 'pool'
            ? item.options
            : [
                {
                  course: item.course,
                  name: item.label,
                  ects: item.ects,
                  group: null
                }
              ]
        for (const entry of entries) {
          const key = entryKey(entry)
          const list = slotsOf.get(key) ?? []
          list.push({ label: slot.label, itemId: item.id })
          slotsOf.set(key, list)
        }
      }

    const passes = (entry: PlanEntry, item: PlanItem) => {
      const course = entry.course ? coursesById.get(entry.course.id) : null
      if (filter.fixed !== null && (item.kind === 'course') !== filter.fixed)
        return false
      if (
        filter.trackCourseIds !== null &&
        !(entry.course && filter.trackCourseIds.has(entry.course.id))
      )
        return false
      if (
        filter.hasMandatoryExam !== null &&
        course?.hasMandatoryExam !== filter.hasMandatoryExam
      )
        return false
      if (!query) return true
      const own = course
        ? `${course.name} ${course.acronym} ${course.altName ?? ''}`
        : `${entry.course?.name ?? ''} ${entry.course?.acronym ?? ''} ${entry.name ?? ''}`
      // A pool's or a group's name finds all of it: "HASS", "Alemão"
      const context =
        item.kind === 'pool' ? `${item.label ?? ''} ${entry.group ?? ''}` : ''
      return insensitiveMatch(`${own} ${context}`, query)
    }

    // Within each list (a semester's courses, a group of a pool's options);
    // ties keep the plan's order, as the sort is stable
    const byCourse = compareCourses(sortBy)
    const sorted = (list: ListedEntry[]) => {
      return [...list].sort((a, b) => {
        // A name without a page has nothing to rank by: after those that do
        if (!a.course || !b.course) {
          if (a.course) return -1
          if (b.course) return 1
          return sortBy === 'alphabetical' ? a.name.localeCompare(b.name) : 0
        }
        return byCourse(a.course, b.course)
      })
    }

    const shown = new Set<string>()
    let position = 0
    let count = 0
    const listEntry = (
      entry: PlanEntry,
      slot: Slot,
      item: PlanItem,
      ects: number | null
    ): ListedEntry | null => {
      const key = entryKey(entry)
      if (filtering) {
        if (shown.has(key)) return null
        shown.add(key)
      }
      return {
        key,
        course: entry.course
          ? (coursesById.get(entry.course.id) ?? null)
          : null,
        name: entry.course?.name ?? entry.name ?? '',
        ects,
        alsoIn: filtering
          ? [
              ...new Set(
                (slotsOf.get(key) ?? [])
                  .filter(
                    (other) =>
                      other.itemId !== item.id && other.label !== slot.label
                  )
                  .map((other) => other.label)
              )
            ]
          : [],
        position: 0
      }
    }
    // Numbered once sorted, in the order the page shows them
    const number = (list: ListedEntry[]) => {
      for (const entry of list) entry.position = position++
      count += list.length
      return list
    }

    const listSlot = (slot: Slot): ListedSlot => {
      const courses = number(
        sorted(
          slot.items
            .filter((item) => item.kind === 'course')
            .flatMap((item) => {
              const entry: PlanEntry = {
                course: item.course,
                name: item.label,
                ects: item.ects,
                group: null
              }
              if (!passes(entry, item)) return []
              const listed = listEntry(entry, slot, item, item.ects)
              return listed ? [listed] : []
            })
        )
      )
      const pools = slot.items
        .filter((item) => item.kind === 'pool')
        .flatMap((item): ListedPool[] => {
          // A choice with no course to open (MEIC's extracurricular
          // activities, an unpublished list, FLUL's options at other schools)
          // has nothing to rate or compare: it stays on the degree page's plan
          if (!item.options.some((option) => option.course !== null)) return []
          const groups = groupEntries(item.options)
            .map((group) => ({
              label: group.label,
              entries: number(
                sorted(
                  group.entries.flatMap((entry) => {
                    if (!passes(entry, item)) return []
                    const listed = listEntry(
                      entry,
                      slot,
                      item,
                      entry.ects ?? entry.course?.ects ?? null
                    )
                    return listed ? [listed] : []
                  })
                )
              )
            }))
            .filter((group) => group.entries.length > 0)
          return groups.length > 0 ? [{ item, groups }] : []
        })
      return {
        key: slot.key,
        heading: slot.heading,
        isLane: slot.isLane,
        courses,
        pools
      }
    }

    const isEmpty = (slot: ListedSlot) =>
      slot.courses.length === 0 && slot.pools.length === 0
    const years: ListedYear[] = rows
      .map((row) => {
        const laneSlots = (lanesByYear.get(row.year) ?? []).map(listSlot)
        const looseSlots = (looseByYear.get(row.year) ?? [])
          .map(listSlot)
          .filter((slot) => !isEmpty(slot))
        return { year: row.year, lanes: laneSlots, loose: looseSlots }
      })
      // A filter can empty a year: it goes, and its tab with it
      .filter(
        (year) =>
          year.loose.length > 0 || year.lanes.some((slot) => !isEmpty(slot))
      )

    const planCourseIds = new Set<number>()
    for (const item of plan.items) {
      if (item.course) planCourseIds.add(item.course.id)
      for (const option of item.options)
        if (option.course) planCourseIds.add(option.course.id)
    }

    return { years, count, filtering, planCourseIds }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, versionId, academicTerms, coursesById, filter, sortBy])
}

export function PlanCourseList({
  listing,
  onInfoOpened,
  onPoolToggled,
  collapsedYears,
  onYearToggle
}: {
  listing: PlanListing
  /**
   * Years the student folded (remembered per degree by the browser). A search
   * or filter shows every year with a match, folded or not.
   */
  collapsedYears: Set<number>
  onYearToggle: (year: number) => void
  /** A pool's (?) opened */
  onInfoOpened: (item: PlanItem) => void
  /** A pool opened or closed by hand */
  onPoolToggled: (item: PlanItem, expanded: boolean) => void
}) {
  const { t } = useTranslation('browse')
  const { fmt, yearLabel, yearsNote, poolSub } = usePlanText()
  // Pools opened or closed by hand, per slot ("1:12:345"): a pool shows in every
  // slot it's open to, and opening it in one doesn't unfold the others
  const [toggled, setToggled] = useState<Map<string, boolean>>(new Map())

  const entryRow = (
    entry: ListedEntry,
    stacked: boolean,
    isOption: boolean
  ) => {
    const alsoIn =
      entry.alsoIn.length > 0
        ? t('degree_courses.also_in', { slots: entry.alsoIn.join('; ') })
        : null
    if (entry.course)
      return (
        <CourseRow
          key={entry.key}
          course={entry.course}
          terms={[]}
          positionInList={entry.position}
          stacked={stacked}
          note={alsoIn}
          planSection={isOption ? 'pool_option' : 'course'}
          hideOptionalTag={isOption}
          filtered={listing.filtering}
        />
      )
    // No page here (a dissertation, an option at another school): just its name
    return (
      <div
        key={entry.key}
        className="flex items-baseline justify-between gap-3 border-b border-border px-3 py-2.5 text-sm last:border-0"
      >
        <span className="min-w-0">
          <span className="text-foreground">{entry.name}</span>
          {alsoIn && (
            <span className="block text-xs italic text-muted-foreground">
              {alsoIn}
            </span>
          )}
        </span>
        {entry.ects !== null && (
          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {t('degree_page.plan.ects', { value: fmt(entry.ects) })}
          </span>
        )}
      </div>
    )
  }

  /**
   * A choice: its name and its (?) (what it asks for, how it works) on a
   * dashed header (the plan's mark for a choice), then its options, scrolling inside the box. Full
   * width (a pool with no fixed semester), the options run in two columns.
   *
   * It folds to its header. Browsing, it starts closed next to fixed courses
   * (a semester reads as its courses plus "and one of these"), and open when
   * the slot holds only choices (MEIC's 1st year), where closed pools would be
   * all there is. Filtering, the pools left are those with a match: open.
   * Closed, the options stay in the page, only hidden, for search engines.
   */
  const poolBox = (
    slot: ListedSlot,
    { item, groups }: ListedPool,
    wide: boolean
  ) => {
    const key = `${slot.key}:${item.id}`
    const isOpen = listing.filtering
      ? true
      : (toggled.get(key) ?? slot.courses.length === 0)
    const toggle = () => {
      if (listing.filtering) return
      setToggled((prev) => new Map(prev).set(key, !isOpen))
      onPoolToggled(item, !isOpen)
    }
    return (
      <div
        key={item.id}
        className="mt-4 rounded-lg border border-dashed border-muted-foreground/40"
      >
        <div
          onClick={toggle}
          className={cn(
            'flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3 py-2',
            !listing.filtering && 'cursor-pointer',
            isOpen && 'border-b border-dashed border-muted-foreground/40'
          )}
        >
          <h4 className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
            {/* The header is the toggle; the button gives it a keyboard stop
                and its state (a click on it bubbles to the header) */}
            <button
              type="button"
              aria-expanded={isOpen}
              disabled={listing.filtering}
              className="flex min-w-0 cursor-pointer items-center gap-1 text-left disabled:cursor-default"
            >
              <ChevronRight
                aria-hidden="true"
                className={cn(
                  'size-3.5 shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-90'
                )}
              />
              <span className="min-w-0">
                {item.label}
                {spansYears(item) && (
                  <span className="ml-1.5 text-xs font-normal italic text-muted-foreground">
                    ({yearsNote(item)})
                  </span>
                )}
              </span>
            </button>
            {/* What the choice asks for (ECTS, how many) and how it works:
                in the (?), as it's not what students compare here */}
            <span
              className="flex shrink-0"
              onClick={(event) => event.stopPropagation()}
            >
              <InfoPopover
                label={t('degree_courses.pool_info', { name: item.label })}
                className="[&_svg]:size-3.5"
                onOpenChange={(open) => open && onInfoOpened(item)}
                content={
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    <p className="font-medium tabular-nums text-foreground">
                      {poolSub(item)}
                    </p>
                    {item.description && (
                      <Markdown>{item.description}</Markdown>
                    )}
                  </div>
                }
              />
            </span>
          </h4>
        </div>
        <div
          className={cn(
            'max-h-[28rem] overflow-y-auto overscroll-contain',
            wide && 'md:grid md:grid-cols-2 md:gap-x-6',
            !isOpen && 'hidden md:hidden'
          )}
        >
          {groups.map((group, gi) => (
            <div key={gi} className={cn(wide && 'contents')}>
              {group.label && (
                <div
                  className={cn(
                    'px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                    wide && 'md:col-span-2'
                  )}
                >
                  {group.label}
                </div>
              )}
              {group.entries.map((entry) => entryRow(entry, true, true))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const slotBody = (slot: ListedSlot) => (
    <>
      {/* Full width (no fixed semester), the courses run in two columns like
          a wide pool's options, so every row reads the same way */}
      {slot.courses.length > 0 && (
        <div
          className={cn(!slot.isLane && 'md:grid md:grid-cols-2 md:gap-x-6')}
        >
          {slot.courses.map((entry) => entryRow(entry, true, false))}
        </div>
      )}
      {slot.pools.map((pool) => poolBox(slot, pool, !slot.isLane))}
    </>
  )

  const slotHead = (heading: string) => (
    <h3 className="border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {heading}
    </h3>
  )

  return (
    <div className="space-y-8">
      {listing.years.map((year) => {
        const hasLanes = year.lanes.length > 0
        const isOpen = listing.filtering || !collapsedYears.has(year.year)
        return (
          <section key={year.year}>
            <h2
              id={yearAnchorId(year.year)}
              className="scroll-mt-(--sticky-offset) text-base font-semibold text-foreground md:text-lg"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                disabled={listing.filtering}
                onClick={() => onYearToggle(year.year)}
                className="flex cursor-pointer items-center gap-1.5 text-left disabled:cursor-default"
              >
                <ChevronRight
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-90'
                  )}
                />
                {yearLabel(year.year)}
              </button>
            </h2>
            {/* Folded, the year stays in the page, only hidden, for search
                engines */}
            <div className={cn('mt-4', !isOpen && 'hidden')}>
              {hasLanes && (
                <div className="flex flex-col gap-8 md:flex-row md:gap-6">
                  {year.lanes.map((slot) => {
                    const empty =
                      slot.courses.length === 0 && slot.pools.length === 0
                    return (
                      // An empty semester keeps its column on desktop, so the
                      // semesters line up and don't jump while typing
                      <div
                        key={slot.key}
                        className={cn(
                          'min-w-0 flex-1',
                          empty && 'hidden md:block'
                        )}
                      >
                        {slot.heading && slotHead(slot.heading)}
                        {empty ? (
                          <p className="px-3 py-3 text-sm text-muted-foreground">
                            {listing.filtering
                              ? t('degree_courses.slot_no_match')
                              : t('degree_courses.slot_empty')}
                          </p>
                        ) : (
                          slotBody(slot)
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {year.loose.map((slot) => (
                <div key={slot.key} className={cn(hasLanes && 'mt-8')}>
                  {slot.heading && slotHead(slot.heading)}
                  {slotBody(slot)}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
