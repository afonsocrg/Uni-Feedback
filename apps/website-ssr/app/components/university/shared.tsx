import type { DegreeType } from '@uni-feedback/db/schema'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import type { Lang } from '~/i18n/config'
import {
  analytics,
  type UniversityLinkTarget,
  type UniversityPageKind
} from '~/utils/analytics'
import { getFacultyTypePath, isFacultyTypePage } from '~/utils/facultyTypePages'
import { getFacultyPath } from '~/utils/i18n-routes'
import { SchoolLogo } from '../common/SchoolLogo'
import { formatEur, formatInt } from '../degree/content'
import type { FeeRange, UniversityFaculty } from './types'

/** Type order on every list */
export const TYPE_ORDER: DegreeType[] = [
  'bachelor',
  'integrated_master',
  'master',
  'minor',
  'postgraduate',
  'phd',
  'other'
]

/** The faculty's type page (`/ist/licenciaturas`); null for `other` */
export function getTypePagePath(
  lang: Lang,
  facultySlug: string,
  type: DegreeType
): string | null {
  return isFacultyTypePage(type)
    ? getFacultyTypePath(lang, facultySlug, type)
    : null
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

/** "697 €" / "825 € a 2 500 €", with the period ("por ano") */
export function useFeeText() {
  const { t } = useTranslation('university')
  const lang = useLang()
  return (range: FeeRange) => {
    const amount =
      range.min === range.max
        ? formatEur(range.min, lang)
        : t('page.fees.range', {
            min: formatEur(range.min, lang),
            max: formatEur(range.max, lang)
          })
    const period = t(`page.fees.per.${range.period}`, {
      defaultValue: range.period
    })
    return `${amount} ${period}`
  }
}

/** "Técnico, Letras e Direito" */
export function useJoinList() {
  const { t } = useTranslation('university')
  return (items: string[]) =>
    items.length <= 1
      ? (items[0] ?? '')
      : `${items.slice(0, -1).join(', ')}${t('page.and')}${items.at(-1)}`
}

/** "19 licenciaturas", "1 mestrado integrado" */
export function useTypeCountLabel() {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (type: DegreeType, count: number) =>
    `${formatInt(count, lang)} ${(count === 1
      ? t(`degree_page.facts.type.${type}`)
      : t(`degree_types.${type}`)
    ).toLowerCase()}`
}

/** Cards linking to each faculty: campuses, degrees per type, feedback */
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
            {faculty.campuses.length > 0 && (
              <span className="block text-xs text-muted-foreground">
                {faculty.campuses.map((c) => c.name).join(', ')}
              </span>
            )}
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
