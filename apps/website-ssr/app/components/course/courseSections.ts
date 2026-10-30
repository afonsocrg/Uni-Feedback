import type { StandardTerm } from '@uni-feedback/api-client'
import { CHIP_COLOR_KEYS } from '@uni-feedback/ui'
import { toOrdinal } from '@uni-feedback/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLang, useTermLabel } from '~/hooks'
import type { CourseSection, CourseWithFeedback } from './types'

/**
 * How a degree's courses are grouped into (curriculum year, term) sections, and
 * sorted. Shared by the degree page's plan summary and the full course browser
 * (`/:faculty/:degree/cadeiras`), so both list a year the same way.
 */

export interface CourseGroupWithIds {
  id: number
  name: string
  courseIds: number[]
}

/** Just enough of a term to order and label a run or a bucket. */
export interface TermLabel {
  name: string
  standardTerm: StandardTerm | null
  startTick: number
  endTick: number
}

export interface AcademicTermInfo extends TermLabel {
  id: number
  parentId: number | null
}

/** One course in a bucket, with the terms it runs in there. */
interface BucketEntry {
  course: CourseWithFeedback
  terms: TermLabel[]
}

/**
 * All the courses of one curriculum year that run in the same set of terms
 * (just S1, or both S1 and S2). `terms` is in timeline order.
 */
interface CourseBucket {
  key: string
  curriculumYear: number | null
  terms: TermLabel[]
  entries: BucketEntry[]
}

/** A `CourseBucket` mid-build, its entries still keyed by course for lookup. */
type BucketAccumulator = Omit<CourseBucket, 'entries'> & {
  entries: Map<number, BucketEntry>
}

/**
 * The term a course is bucketed under: its offering's own term, or that term's
 * parent when it has one (P1 buckets under S1, a half-semester under its
 * semester).
 *
 * The parent is read, never inferred from the ticks. Containment can't tell a
 * parent from a mere container: Nova FCT's "Full Year" spans both semesters
 * without being their heading, and its interim term sits between them, inside
 * neither. Both are top-level, so both keep a bucket of their own.
 *
 * Offerings carry a term's name but not its id, and `(faculty_id, name)` is
 * unique, so the name is what resolves an offering to the faculty's term. A term
 * we can't resolve buckets under itself.
 */
function bucketTermOf(
  term: TermLabel,
  academicTerms: AcademicTermInfo[]
): TermLabel {
  const self = academicTerms.find((t) => t.name === term.name)
  if (!self?.parentId) return term
  return academicTerms.find((t) => t.id === self.parentId) ?? term
}

/**
 * Earlier terms first; on a tie, longer terms first. This is the ordering
 * convention the terms are stored under, and it puts a container (S1, 1-4) ahead
 * of the periods nested in it (P1, 1-2).
 */
const byTerm = (a: TermLabel, b: TermLabel) =>
  a.startTick !== b.startTick
    ? a.startTick - b.startTick
    : b.endTick - a.endTick

export type SortOption = 'rating' | 'alphabetical' | 'reviews' | 'workload'

export function compareCourses(sortBy: SortOption) {
  return (a: CourseWithFeedback, b: CourseWithFeedback) => {
    switch (sortBy) {
      case 'rating':
        return Number(b.averageRating || 0) - Number(a.averageRating || 0)
      case 'alphabetical':
        return a.name.localeCompare(b.name)
      case 'reviews':
        return (
          Number(b.totalFeedbackCount || 0) - Number(a.totalFeedbackCount || 0)
        )
      case 'workload':
        return Number(b.averageWorkload || 0) - Number(a.averageWorkload || 0)
      default:
        return 0
    }
  }
}

/** Curriculum years the offered courses run in, ascending. */
export function useAvailableCurriculumYears(
  offeredCourses: CourseWithFeedback[]
): number[] {
  return useMemo(() => {
    const years = new Set<number>()
    offeredCourses.forEach((course) => {
      course.offerings.forEach((offering) => {
        if (offering.curriculumYear !== null) {
          years.add(offering.curriculumYear)
        }
      })
    })
    return Array.from(years).sort((a, b) => a - b)
  }, [offeredCourses])
}

/**
 * The listing's sections for already filtered and sorted courses, narrowed to
 * one curriculum year and/or term when those are active.
 */
export function useCourseSections(
  filteredCourses: CourseWithFeedback[],
  activeCurriculumYear: number | null,
  activeTerm: string | null,
  academicTerms: AcademicTermInfo[]
): CourseSection[] {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const termLabel = useTermLabel()

  // Group the filtered courses into (curriculum year, parent term) buckets, each
  // split into runs of courses sharing a term.
  //
  // Bucketing a sub-term under its parent rather than by raw term is what keeps
  // the listing readable: faculties that cut a semester into periods would
  // otherwise strand 1-2 courses under every heading (LEIC: 17 headings for 30
  // courses, against 6 here), and a listing that breaks every other row is hard
  // to read. Each course keeps a tag naming its own term, which is what tells P1
  // and P2 courses apart inside the merged bucket.
  //
  // A course is listed once. It goes to its earliest curriculum year (unknown
  // last), in the bucket for the whole set of terms it runs in that year: a
  // course offered in both semesters sits under "Fall and Spring", not under
  // each (which doubled Nova SBE's plan, BE: 50 courses over 90 rows) nor under
  // Fall alone (which emptied its Spring, since SBE runs nearly every course
  // twice a year). A course with no offerings, or none
  // matching the active year/term filters, falls into a trailing "Other" bucket
  // so nothing is silently dropped. `filteredCourses` is already sorted by
  // `sortBy`, and we preserve that order while bucketing, so each bucket stays
  // sorted within a term.
  const courseBuckets = useMemo(() => {
    const buckets = new Map<string, BucketAccumulator>()
    const other: CourseWithFeedback[] = []

    for (const course of filteredCourses) {
      const offerings = course.offerings.filter((o) => {
        const matchesYear =
          activeCurriculumYear === null ||
          o.curriculumYear === activeCurriculumYear
        const matchesTerm = !activeTerm || o.academicTerm.name === activeTerm
        return matchesYear && matchesTerm
      })

      if (offerings.length === 0) {
        other.push(course)
        continue
      }

      const yearOf = (o: (typeof offerings)[number]) =>
        o.curriculumYear ?? Infinity
      const earliestYear = Math.min(...offerings.map(yearOf))
      const yearOfferings = offerings.filter((o) => yearOf(o) === earliestYear)
      const curriculumYear = yearOfferings[0].curriculumYear

      const bucketTerms: TermLabel[] = []
      const terms: TermLabel[] = []
      for (const o of yearOfferings) {
        const bucketTerm = bucketTermOf(o.academicTerm, academicTerms)
        if (!bucketTerms.some((t) => t.name === bucketTerm.name)) {
          bucketTerms.push(bucketTerm)
        }
        // A course may list the same year/term twice; tag it once.
        if (!terms.some((t) => t.name === o.academicTerm.name)) {
          terms.push(o.academicTerm)
        }
      }
      bucketTerms.sort(byTerm)

      const bucketKey = `${curriculumYear ?? 'x'}|${bucketTerms.map((t) => t.name).join('+')}`
      let bucket = buckets.get(bucketKey)
      if (!bucket) {
        bucket = {
          key: bucketKey,
          curriculumYear,
          terms: bucketTerms,
          entries: new Map()
        }
        buckets.set(bucketKey, bucket)
      }
      bucket.entries.set(course.id, { course, terms })
    }

    // A course sits at its earliest term, so one offered in both P1 and P2 sorts
    // with the P1 courses rather than drifting to the end of the bucket.
    const earliestTerm = (entry: BucketEntry) =>
      entry.terms.reduce((a, b) => (byTerm(a, b) <= 0 ? a : b))

    const ordered = Array.from(buckets.values()).sort((a, b) => {
      // Curriculum year ascending, unknown year last.
      const ay = a.curriculumYear ?? Infinity
      const by = b.curriculumYear ?? Infinity
      if (ay !== by) return ay - by
      // Then by first term, and on a tie the one ending sooner: Fall, then
      // Fall and Spring, then Spring.
      const byFirst = byTerm(a.terms[0], b.terms[0])
      if (byFirst !== 0) return byFirst
      return (
        a.terms[a.terms.length - 1].endTick -
        b.terms[b.terms.length - 1].endTick
      )
    })

    const withEntries = ordered.map((bucket) => ({
      ...bucket,
      // Term first, then known electives (isMandatory === false) last within a
      // term, keeping core and unknown courses up front. The sort is stable and
      // entries were inserted in `filteredCourses` order, so each tier keeps the
      // `sortBy` order it inherited.
      entries: Array.from(bucket.entries.values()).sort((a, b) => {
        const byT = byTerm(earliestTerm(a), earliestTerm(b))
        if (byT !== 0) return byT
        return (
          Number(a.course.isMandatory === false) -
          Number(b.course.isMandatory === false)
        )
      })
    }))

    const electivesLast = (courses: CourseWithFeedback[]) =>
      courses.sort(
        (a, b) =>
          Number(a.isMandatory === false) - Number(b.isMandatory === false)
      )

    return { buckets: withEntries, other: electivesLast(other) }
  }, [filteredCourses, activeCurriculumYear, activeTerm, academicTerms])

  // One hue per term, fixed for the whole faculty.
  //
  // Colour walks the palette in timeline order rather than hashing the term
  // name, because the terms that need telling apart are exactly the ones next to
  // each other: hashing put IST's P1 and P2 on indigo and blue, ΔE 3.5 apart
  // (indistinguishable), and those two share every S1 section. Walking in order
  // means neighbouring terms take neighbouring hues, which the palette orders to
  // be distant. Still deterministic, so a term keeps its colour across pages.
  const termColors = useMemo(() => {
    const ordered = [...academicTerms].sort(byTerm)
    return new Map(
      ordered.map((term, i) => [
        term.name,
        CHIP_COLOR_KEYS[i % CHIP_COLOR_KEYS.length]
      ])
    )
  }, [academicTerms])

  // With a year chosen, every heading would repeat it, so the heading is the
  // term alone, spelled out ("1º Semestre"). Beside a year it takes the short
  // form ("1º ano · S1"). A bucket of several terms lists them all ("S1 e S2").
  const termsLabel = (bucket: CourseBucket, form: 'short' | 'long') =>
    new Intl.ListFormat(lang, { type: 'conjunction' }).format(
      bucket.terms.map((term) => termLabel(term, form))
    )
  const bucketHeading = (bucket: CourseBucket) => {
    if (activeCurriculumYear !== null || bucket.curriculumYear === null) {
      return termsLabel(bucket, 'long')
    }
    const yearLabel = t('degree_page.year_option', {
      year:
        lang === 'en' ? toOrdinal(bucket.curriculumYear) : bucket.curriculumYear
    })
    return `${yearLabel} · ${termsLabel(bucket, 'short')}`
  }

  // The sections every listing component renders. Degrees with no
  // curriculum-year data group by term alone, under bare "1º Semestre"/"Fall" headings:
  // the term is the only structure their offerings carry, and dropping it left
  // every IST master's and all of Nova SBE as one undifferentiated list (MEIC:
  // 60 courses, MIEI: 174). A course offered in both terms sits under the
  // earlier one.
  //
  // Only when nothing buckets at all, every filtered course lacking an offering,
  // do we fall back to a single unheaded section holding the flat sorted list.
  const sections: CourseSection[] =
    courseBuckets.buckets.length === 0
      ? [
          {
            key: 'all',
            heading: null,
            entries: filteredCourses.map((course) => ({ course, terms: [] }))
          }
        ]
      : [
          ...courseBuckets.buckets.map((bucket) => ({
            key: bucket.key,
            heading: bucketHeading(bucket),
            entries: bucket.entries.map((entry) => ({
              course: entry.course,
              // A course running a bucket term whole earns no tag for it: the
              // section heading already names that term.
              terms: entry.terms
                .filter(
                  (term) => !bucket.terms.some((b) => b.name === term.name)
                )
                .map((term) => ({
                  label: termLabel(term, 'short'),
                  color: termColors.get(term.name) ?? 'gray'
                }))
            }))
          })),
          ...(courseBuckets.other.length > 0
            ? [
                {
                  key: 'other',
                  heading: t('degree_page.other_courses'),
                  entries: courseBuckets.other.map((course) => ({
                    course,
                    terms: []
                  }))
                }
              ]
            : [])
        ]

  return sections
}
