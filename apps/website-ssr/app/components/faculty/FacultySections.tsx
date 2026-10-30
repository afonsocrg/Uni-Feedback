import { cn } from '@uni-feedback/ui'
import { ArrowRight, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang, useWorkloadLabel } from '~/hooks'
import {
  analytics,
  getPageName,
  type FacultyLinkTarget,
  type FacultyPageKind
} from '~/utils/analytics'
import { getCoursePath, getDegreePath } from '~/utils/i18n-routes'
import { userPreferences } from '~/utils/userPreferences'
import { CampusMap, campusAddress } from '../common/campusMap'
import { formatGrade, formatInt, formatNumber } from '../degree/content'
import { SectionShell } from '../degree/DegreeSections'
import {
  FACULTY_HIGHLIGHT_MIN_FEEDBACK,
  type FacultyCampus,
  type FacultyCourseStat,
  type FacultyHighlights
} from './types'

/** Who the page is about, for analytics */
export interface FacultyTrack {
  facultySlug: string
  page: FacultyPageKind
}

export function trackFacultyLink(
  track: FacultyTrack,
  target: FacultyLinkTarget,
  surface: string
) {
  analytics.faculty.linkClicked({
    facultySlug: track.facultySlug,
    page: track.page,
    target,
    surface
  })
}

/**
 * A degree's acronym (linked) over its name, the first cell of every table.
 * `nameFirst` swaps them: the name is linked, the acronym sits below.
 */
export function DegreeCell({
  facultySlug,
  degree,
  track,
  surface,
  note,
  nameFirst = false
}: {
  facultySlug: string
  degree: { acronym: string; name: string; slug: string | null }
  track: FacultyTrack
  surface: string
  note?: ReactNode
  nameFirst?: boolean
}) {
  const lang = useLang()
  const [main, sub] = nameFirst
    ? [degree.name, degree.acronym]
    : [degree.acronym, degree.name]
  return (
    <div className="min-w-0">
      {degree.slug ? (
        <Link
          to={getDegreePath(lang, facultySlug, degree.slug)}
          onClick={() => {
            trackFacultyLink(track, 'degree', surface)
            userPreferences.set({
              lastSelectedFacultySlug: facultySlug,
              lastSelectedDegreeSlug: degree.slug ?? undefined
            })
          }}
          className="font-semibold text-primaryBlue hover:underline"
        >
          {main}
        </Link>
      ) : (
        <span className="font-semibold">{main}</span>
      )}
      <span className="block text-xs text-muted-foreground">{sub}</span>
      {note && (
        <span className="block text-xs text-muted-foreground">{note}</span>
      )}
    </div>
  )
}

/** A plain comparison table; cells are rendered by the caller */
export function CompareTable({
  head,
  rows,
  minWidth = 'min-w-[36rem]'
}: {
  head: ReactNode[]
  rows: { key: string | number; cells: ReactNode[] }[]
  minWidth?: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', minWidth)}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="border-b border-border px-2 py-1.5 text-left text-xs font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className="border-b border-border px-2 py-2.5 align-top tabular-nums text-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function NoData() {
  const { t } = useTranslation('browse')
  return (
    <span className="text-muted-foreground">{t('faculty_hub.no_data')}</span>
  )
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-xs text-muted-foreground">{children}</p>
}

/* ------------------------------------------------------------------ */
/* As cadeiras segundo os alunos                                       */
/* ------------------------------------------------------------------ */

function CourseList({
  title,
  courses,
  value,
  track,
  surface
}: {
  title: string
  courses: FacultyCourseStat[]
  value: (course: FacultyCourseStat) => ReactNode
  track: FacultyTrack
  surface: string
}) {
  const lang = useLang()
  if (courses.length === 0) return null
  return (
    <div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <ul>
        {courses.map((course, i) => (
          <li key={course.id}>
            <Link
              to={getCoursePath(lang, course.id)}
              onClick={() => {
                trackFacultyLink(track, 'course', surface)
                analytics.discovery.courseCardClicked({
                  courseId: course.id,
                  sourcePage: getPageName(window.location.pathname),
                  positionInList: i
                })
              }}
              className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-foreground hover:text-primaryBlue"
            >
              <span className="min-w-0">{course.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {value(course)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FacultyHighlightsSection({
  highlights,
  track,
  footer
}: {
  highlights: FacultyHighlights
  track: FacultyTrack
  footer?: ReactNode
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()
  return (
    <SectionShell id="cadeiras" title={t('faculty_hub.sections.highlights')}>
      <div className="grid gap-6 md:grid-cols-3">
        <CourseList
          title={t('faculty_hub.highlights.most_feedback')}
          courses={highlights.mostFeedback}
          value={(c) =>
            t('degree_page.facts.feedback', {
              count: c.feedbackCount,
              n: formatInt(c.feedbackCount, lang)
            })
          }
          track={track}
          surface="highlights_most_feedback"
        />
        <CourseList
          title={t('faculty_hub.highlights.best')}
          courses={highlights.best}
          value={(c) => (
            <span className="inline-flex items-center gap-1">
              <Star
                aria-hidden="true"
                className="size-3.5 fill-rating text-rating"
              />
              {formatGrade(c.rating, lang)}
            </span>
          )}
          track={track}
          surface="highlights_best"
        />
        <CourseList
          title={t('faculty_hub.highlights.heaviest')}
          courses={highlights.heaviest}
          value={(c) => workloadLabel(c.workload)}
          track={track}
          surface="highlights_heaviest"
        />
      </div>
      <SourceNote>
        {t('faculty_hub.highlights.hint', {
          count: FACULTY_HIGHLIGHT_MIN_FEEDBACK,
          n: formatNumber(FACULTY_HIGHLIGHT_MIN_FEEDBACK, lang)
        })}
      </SourceNote>
      {footer}
    </SectionShell>
  )
}

/** Equal up to a trailing slash */
function sameUrl(a: string, b?: string | null) {
  return !!b && a.replace(/\/+$/, '') === b.replace(/\/+$/, '')
}

export function hasHighlights(h: FacultyHighlights) {
  return h.mostFeedback.length + h.best.length + h.heaviest.length > 0
}

/* ------------------------------------------------------------------ */
/* Campi                                                               */
/* ------------------------------------------------------------------ */

export function CampusesSection({
  campuses,
  facultyWebsite,
  track
}: {
  campuses: FacultyCampus[]
  /** Already linked in the header, so a campus link to it is left out */
  facultyWebsite?: string | null
  track: FacultyTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (
    <SectionShell
      id="campi"
      title={t(
        campuses.length > 1
          ? 'faculty_hub.sections.campuses'
          : 'faculty_hub.sections.campus'
      )}
    >
      <CampusMap
        items={campuses.map((campus) => ({
          key: String(campus.id),
          title: campus.name,
          pinLabel: campus.name,
          address: campusAddress(campus),
          latitude: campus.latitude,
          longitude: campus.longitude,
          details: [
            [campus.phone, campus.email].filter(Boolean).join(' · '),
            campus.degreeCount > 0
              ? t('faculty_hub.campus.degrees', {
                  count: campus.degreeCount,
                  n: formatNumber(campus.degreeCount, lang)
                })
              : ''
          ]
            .filter(Boolean)
            .join(' · '),
          website:
            campus.url && !sameUrl(campus.url, facultyWebsite)
              ? campus.url
              : null
        }))}
        onSelect={(item, surface) =>
          analytics.discovery.campusSelected({
            page: 'faculty',
            facultySlug: track.facultySlug,
            campus: item.title,
            surface
          })
        }
        onCopyAddress={(item) =>
          analytics.discovery.campusAddressCopied({
            page: 'faculty',
            facultySlug: track.facultySlug,
            campus: item.title
          })
        }
        onDirections={() => trackFacultyLink(track, 'campus_map', 'campuses')}
        onWebsite={() => trackFacultyLink(track, 'campus_website', 'campuses')}
      />
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Relacionados                                                        */
/* ------------------------------------------------------------------ */

export interface RelatedLink {
  key: string
  kicker: string
  label: string
  href: string
  target: FacultyLinkTarget
}

export function FacultyRelatedSection({
  links,
  track
}: {
  links: RelatedLink[]
  track: FacultyTrack
}) {
  const { t } = useTranslation('browse')
  return (
    <SectionShell id="relacionados" title={t('faculty_hub.sections.related')}>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.key}>
            <Link
              to={link.href}
              onClick={() => trackFacultyLink(track, link.target, 'related')}
              className="block h-full rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
            >
              <small className="block text-xs text-muted-foreground">
                {link.kicker}
              </small>
              <b className="block">{link.label}</b>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

/** "Comparar as licenciaturas →" */
export function ArrowLink({
  to,
  onClick,
  children
}: {
  to: string
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  )
}
