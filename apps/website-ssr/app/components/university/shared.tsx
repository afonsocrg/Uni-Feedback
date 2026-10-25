import { cn } from '@uni-feedback/ui'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import {
  analytics,
  type UniversityLinkTarget,
  type UniversityPageKind
} from '~/utils/analytics'
import { getFacultyPath } from '~/utils/i18n-routes'
import { SchoolLogo } from '../common/SchoolLogo'
import { formatInt } from '../degree/content'
import { TYPE_ORDER, useTypeCountLabel } from './helpers'
import type { SortState } from './tableSort'
import type { UniversityFaculty } from './types'

/**
 * First cell of the degree tables: the faculty's logo, then the degree name
 * and its sub-line. Capped in width so long names wrap instead of pushing the
 * number columns off-screen.
 */
export function DegreeNameCell({
  faculty,
  facultyShortName,
  children
}: {
  faculty: UniversityFaculty | undefined
  facultyShortName: string
  children: ReactNode
}) {
  return (
    <div className="flex max-w-md items-center gap-3">
      <SchoolLogo
        logo={faculty?.logo ?? null}
        name={faculty?.name ?? facultyShortName}
        shortName={facultyShortName}
        size="sm"
      />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  )
}

/** A clickable column header, with `aria-sort` and an arrow for the order */
export function SortableHeader<K extends string>({
  column,
  sort,
  onSort,
  align = 'left',
  className,
  children
}: {
  column: K
  sort: SortState<K>
  onSort: (column: K) => void
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
}) {
  const active = sort.key === column
  const Icon = !active
    ? ArrowUpDown
    : sort.direction === 'asc'
      ? ArrowUp
      : ArrowDown
  return (
    <th
      aria-sort={
        active
          ? sort.direction === 'asc'
            ? 'ascending'
            : 'descending'
          : 'none'
      }
      className={cn(
        'py-1.5 font-medium',
        align === 'right' && 'text-right',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-foreground',
          active && 'text-foreground'
        )}
      >
        {children}
        <Icon
          aria-hidden="true"
          className={cn('size-3', !active && 'opacity-50')}
        />
      </button>
    </th>
  )
}

/** A link out of a university page, tracked as `university_link_clicked` */
export function TrackedLink({
  to,
  universitySlug,
  page,
  target,
  surface,
  className,
  children
}: {
  to: string
  universitySlug: string | null
  page: UniversityPageKind | 'list'
  target: UniversityLinkTarget
  surface: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={className ?? 'text-primaryBlue hover:underline'}
      onClick={() =>
        analytics.university.linkClicked({
          universitySlug,
          page,
          target,
          surface
        })
      }
    >
      {children}
    </Link>
  )
}

/** Cards linking to each faculty: degrees per type, feedback */
export function FacultyCards({
  faculties,
  universitySlug,
  page
}: {
  faculties: UniversityFaculty[]
  universitySlug: string
  page: UniversityPageKind
}) {
  const { t } = useTranslation(['university', 'browse'])
  const lang = useLang()
  const typeCount = useTypeCountLabel()
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {faculties.map((faculty) => (
        <TrackedLink
          key={faculty.id}
          to={getFacultyPath(lang, faculty.slug)}
          universitySlug={universitySlug}
          page={page}
          target="faculty"
          surface="faculty_cards"
          className="flex gap-3 rounded-lg border border-border p-4 text-foreground transition-colors hover:border-primaryBlue"
        >
          <SchoolLogo
            logo={faculty.logo}
            name={faculty.name}
            shortName={faculty.shortName}
          />
          <span className="min-w-0">
            <span className="block font-semibold">{faculty.name}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {TYPE_ORDER.filter((type) => faculty.degreeCounts[type])
                .map((type) => typeCount(type, faculty.degreeCounts[type]!))
                .join(' · ')}
            </span>
            <span className="block text-sm text-muted-foreground">
              {faculty.feedbackCount > 0
                ? t('university:page.faculty_card.feedback', {
                    count: faculty.feedbackCount,
                    n: formatInt(faculty.feedbackCount, lang)
                  })
                : t('university:page.faculty_card.no_feedback')}
            </span>
          </span>
        </TrackedLink>
      ))}
    </div>
  )
}
