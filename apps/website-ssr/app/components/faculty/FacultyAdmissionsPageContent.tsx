import type { Faculty } from '@uni-feedback/db/schema'
import { cn } from '@uni-feedback/ui'
import { getCurrentSchoolYear } from '@uni-feedback/utils'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import {
  FACULTY_TYPE_SEGMENTS,
  getFacultyTypePath,
  isFacultyTypePage
} from '~/utils/facultyTypePages'
import {
  getDegreePath,
  getDegreeSubpagePath,
  getFacultyFeesPath,
  getFacultyPath,
  getUniversityPath
} from '~/utils/i18n-routes'
import { ApplyRoute } from '../degree/AdmissionApply'
import { formatEur, formatInt, formatSchoolYear } from '../degree/content'
import {
  FaqSection,
  SectionShell,
  SubHeading,
  type DegreeTrack
} from '../degree/DegreeSections'
import {
  applySectionLabel,
  applyStatus,
  applyStatusShort,
  buildAdmissionsFaq,
  latestIntake,
  sectionTuition,
  type ApplyStatus,
  type FacultyApplyDegree,
  type FacultyApplySection
} from './admissionsContent'
import { FacultyPageShell } from './FacultyPageShell'
import {
  ArrowLink,
  FacultyRelatedSection,
  trackFacultyLink,
  type FacultyTrack,
  type RelatedLink
} from './FacultySections'
import { feeAmountText } from './feesContent'
import type { FacultyAdmissionsPageData } from './types'

/**
 * How and when to apply to every degree of a faculty (`/nova-sbe/candidaturas`):
 * a summary of where each route stands, then one section per route shared by
 * several degrees (its calendar, our guide, the way to apply, what its
 * degrees cost, and links to the type pages of the degrees it applies to,
 * naming any of those types' degrees with rules of their own), those degrees
 * (each linking to its page and Ingresso), FAQ and links. The rounds and guides live here and only here: a
 * degree's Ingresso shows a shared route's status and links to its section.
 * prds/content_rich_pages.md, "Candidaturas at the faculty level".
 */
export function FacultyAdmissionsPageContent({
  faculty,
  data
}: {
  faculty: Faculty
  data: FacultyAdmissionsPageData
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const facultySlug = faculty.slug ?? ''
  const track: FacultyTrack = { facultySlug, page: 'admissions' }
  const degreeTrack: DegreeTrack = {
    facultySlug,
    degreeSlug: null,
    pageName: `${t('faculty_admissions.crumb')} (${faculty.shortName})`
  }
  const intake = latestIntake(data)
  const degreeCount = new Set([
    ...data.sections.flatMap((s) => s.degrees.map((d) => d.id)),
    ...data.ownRoutes.map((r) => r.degree.id)
  ]).size

  const facts: ReactNode[] = [
    ...(intake !== null
      ? [
          <span key="year">
            {t('faculty_admissions.facts.year', {
              year: formatSchoolYear(intake)
            })}
          </span>
        ]
      : []),
    <span key="count">
      {t('faculty_admissions.facts.count', {
        count: degreeCount,
        n: formatInt(degreeCount, lang)
      })}
    </span>
  ]

  const faq = buildAdmissionsFaq(t, lang, faculty.shortName, data)

  const related: RelatedLink[] = [
    {
      key: 'hub',
      kicker: t('faculty_hub.related.faculty'),
      label: faculty.name,
      href: getFacultyPath(lang, facultySlug),
      target: 'faculty'
    },
    ...data.types.filter(isFacultyTypePage).map((type) => ({
      key: type,
      kicker: t('faculty_hub.related.type_page', { name: faculty.shortName }),
      label: t(`degree_types.${type}`),
      href: getFacultyTypePath(lang, facultySlug, type),
      target: 'type_page' as const
    })),
    ...(data.hasFeesPage
      ? [
          {
            key: 'fees',
            kicker: t('faculty_fees.related.kicker'),
            label: t('faculty_fees.related.label', {
              year: formatSchoolYear(getCurrentSchoolYear())
            }),
            href: getFacultyFeesPath(lang, facultySlug),
            target: 'fees_page' as const
          }
        ]
      : []),
    ...(data.university
      ? [
          {
            key: 'university',
            kicker: t('faculty_hub.related.university'),
            label: data.university.name,
            href: getUniversityPath(lang, data.university.slug),
            target: 'university' as const
          }
        ]
      : [])
  ]

  const sections = [
    { id: 'resumo', label: t('faculty_admissions.sections.summary') },
    ...data.sections.map((s) => ({
      id: s.id,
      label: applySectionLabel(t, s)
    })),
    ...(data.ownRoutes.length > 0
      ? [{ id: 'regras-proprias', label: t('faculty_admissions.sections.own') }]
      : []),
    ...(faq.length > 0
      ? [{ id: 'faq', label: t('degree_page.sections.faq') }]
      : []),
    { id: 'relacionados', label: t('faculty_hub.sections.related') }
  ]

  // The name opens the degree page (what the degree is, what students say);
  // "ingresso" its admission sub-page (grades, vagas, fees). Both tracked, to
  // see which one students use.
  const degreeLink = (degree: FacultyApplyDegree, surface: string) => (
    <span>
      <Link
        to={getDegreePath(lang, facultySlug, degree.slug)}
        onClick={() => trackFacultyLink(track, 'degree', surface)}
        className="text-primaryBlue hover:underline"
      >
        {degree.name}
      </Link>
      <span className="text-muted-foreground"> · {degree.acronym} · </span>
      <Link
        to={getDegreeSubpagePath(lang, facultySlug, degree.slug, 'admission')}
        onClick={() => trackFacultyLink(track, 'degree_admission', surface)}
        className="inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-primaryBlue hover:underline"
      >
        {t('faculty_admissions.admission_link')}
        <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </span>
  )

  return (
    <FacultyPageShell
      facultySlug={facultySlug}
      facultyShortName={faculty.shortName}
      facultyName={faculty.name}
      university={data.university}
      page="admissions"
      crumb={t('faculty_admissions.crumb')}
      title={t('faculty_admissions.title', { name: faculty.name })}
      subtitle={t('faculty_admissions.intro', { name: faculty.shortName })}
      facts={facts}
      sections={sections}
      degreeCount={degreeCount}
    >
      <SectionShell
        id="resumo"
        title={t('faculty_admissions.sections.summary')}
        first
      >
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {data.sections.map((s) => {
            const { status, next } = applyStatus(s.view)
            const fee = s.view.guide?.applicationFee
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block h-full rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
                >
                  <small className="block text-xs text-muted-foreground">
                    {applySectionLabel(t, s)}
                  </small>
                  <span className="mt-0.5 flex items-baseline gap-2 font-semibold">
                    <StatusDot status={status} />
                    {applyStatusShort(t, lang, s.view) ??
                      t('faculty_admissions.status.guide_only')}
                  </span>
                  {(next || fee) && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {[
                        next?.label,
                        fee &&
                          t('faculty_admissions.fee_short', {
                            fee: formatEur(fee.amountEur, lang)
                          })
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </SectionShell>

      {data.sections.map((s) => (
        <SectionShell key={s.id} id={s.id} title={applySectionLabel(t, s)}>
          <ApplyRoute
            route={s.view}
            today={data.today}
            track={degreeTrack}
            showHeading={false}
            onLinkClick={(kind, roundStatus) =>
              analytics.faculty.applyLinkClicked({
                facultySlug,
                section: s.id,
                route: s.route,
                audience: s.audience,
                kind,
                roundStatus
              })
            }
          />
          <TuitionLine
            section={s}
            data={data}
            facultySlug={facultySlug}
            track={track}
          />
          {/* Which degrees the route is for: their type pages, and the ones
              of those types that follow rules of their own instead */}
          <div className="flex flex-wrap gap-x-6">
            {s.types.filter(isFacultyTypePage).map((type) => (
              <ArrowLink
                key={type}
                to={getFacultyTypePath(lang, facultySlug, type)}
                onClick={() =>
                  trackFacultyLink(track, 'type_page', `admissions_${s.id}`)
                }
              >
                {t(`faculty_admissions.applies_to.${type}`)}
              </ArrowLink>
            ))}
          </div>
          {(() => {
            const covered = new Set(s.degrees.map((d) => d.id))
            const exceptions = [
              ...new Map(
                data.ownRoutes
                  .filter(
                    (r) =>
                      s.types.includes(r.degree.type) &&
                      !covered.has(r.degree.id)
                  )
                  .map((r) => [r.degree.id, r.degree.acronym])
              ).values()
            ]
            return exceptions.length > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('faculty_admissions.except', {
                  list: new Intl.ListFormat(lang === 'en' ? 'en-GB' : 'pt-PT', {
                    type: 'conjunction'
                  }).format(exceptions)
                })}{' '}
                <a href="#regras-proprias" className="hover:underline">
                  {t('faculty_admissions.except_link')}
                </a>
              </p>
            ) : null
          })()}
        </SectionShell>
      ))}

      {data.ownRoutes.length > 0 && (
        <SectionShell
          id="regras-proprias"
          title={t('faculty_admissions.sections.own')}
        >
          <p className="mb-3 max-w-prose text-muted-foreground">
            {t('faculty_admissions.own_intro')}
          </p>
          <ul className="space-y-2">
            {data.ownRoutes.map(({ degree, view }) => {
              const { status } = applyStatus(view)
              const short = applyStatusShort(t, lang, view)
              return (
                <li key={`${degree.id}-${view.route}-${view.audience}`}>
                  {degreeLink(degree, 'admissions_own')}
                  {short && (
                    <span className="ml-2 inline-flex items-baseline gap-1.5 text-sm text-muted-foreground">
                      <StatusDot status={status} />
                      {short}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </SectionShell>
      )}

      {faq.length > 0 && (
        <FaqSection items={faq} surface="faculty_admissions_page" />
      )}

      <FacultyRelatedSection links={related} track={track} />
    </FacultyPageShell>
  )
}

/**
 * "Propinas. 2026/27: de 11 900 € a 13 250 € no total, conforme o curso. Ver
 * propinas de cada curso": what the section's degrees cost, linking to their
 * table on the propinas page (the full figures live there, not here)
 */
function TuitionLine({
  section,
  data,
  facultySlug,
  track
}: {
  section: FacultyApplySection
  data: FacultyAdmissionsPageData
  facultySlug: string
  track: FacultyTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const tuition = sectionTuition(section, data.fees)
  if (!tuition || !data.hasFeesPage) return null
  const summary = tuition.summary
  const amount = !summary
    ? null
    : summary.min.amountEur === summary.max.amountEur
      ? feeAmountText(t, lang, summary.max)
      : t('faculty_admissions.tuition.range', {
          min: formatEur(summary.min.amountEur, lang),
          max: feeAmountText(t, lang, summary.max)
        })
  // The propinas page's table for the section's first type
  const type = section.types.find(isFacultyTypePage)
  return (
    <>
      <SubHeading>{t('faculty_admissions.tuition.title')}</SubHeading>
      <p className="max-w-prose">
        {amount
          ? t(
              section.audience === 'international'
                ? 'faculty_admissions.tuition.line_international'
                : 'faculty_admissions.tuition.line',
              { year: formatSchoolYear(tuition.schoolYear), amount }
            )
          : t('faculty_admissions.tuition.varies')}{' '}
        <Link
          to={getFacultyFeesPath(
            lang,
            facultySlug,
            type ? FACULTY_TYPE_SEGMENTS[type].pt : null
          )}
          onClick={() =>
            trackFacultyLink(track, 'fees_page', `admissions_${section.id}`)
          }
          className="font-semibold text-primaryBlue hover:underline"
        >
          {t('faculty_admissions.tuition.link')}
        </Link>
      </p>
    </>
  )
}

/** The status dot of the Ingresso page's status line */
export function StatusDot({ status }: { status: ApplyStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-2 shrink-0 -translate-y-px rounded-full',
        status === 'open' && 'bg-success',
        status === 'upcoming' && 'bg-brand-solid',
        (status === 'closed' || status === 'none') && 'bg-muted-foreground/40'
      )}
    />
  )
}
