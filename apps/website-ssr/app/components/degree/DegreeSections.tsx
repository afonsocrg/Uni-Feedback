import type { Degree } from '@uni-feedback/db/schema'
import { cn, Markdown } from '@uni-feedback/ui'
import { ArrowRight, Star } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import {
  useAuth,
  useLang,
  useShowChatEntryPoints,
  useWorkloadLabel
} from '~/hooks'
import {
  analytics,
  getPageName,
  type DegreeSectionId,
  type DegreeSourceLink
} from '~/utils/analytics'
import {
  getCoursePath,
  getDegreePath,
  getLocalePath
} from '~/utils/i18n-routes'
import type { Localized } from '~/utils/localizedContent'
import { campusAddress, CampusMap } from '../common/campusMap'
import { ContributeNote } from '../common/ContributeNote'
import { InfoPopover } from '../common/InfoPopover'
import { ReportErrorNote } from '../common/ReportErrorNote'
import type { CourseWithFeedback } from '../course/types'
import { AdmissionChart } from './AdmissionChart'
import {
  formatAcademicYear,
  formatEur,
  formatGrade,
  formatInt,
  formatNumber,
  formatPct,
  formatSchoolYear,
  HIGHLIGHT_MIN_FEEDBACK,
  latestGrades,
  type CourseHighlights,
  type FaqItem
} from './content'
import type {
  DegreeAdmissions,
  DegreeCampusInfo,
  DegreeFees,
  DegreeOutcomes,
  RelatedDegree
} from './pageTypes'

/** Who the page is about, for analytics and the report/contribute emails. */
export interface DegreeTrack {
  facultySlug: string | null
  degreeSlug: string | null
  /** "LEIC-A (IST)" */
  pageName: string
}

export function SectionShell({
  id,
  title,
  children,
  first = false
}: {
  /** A degree section, or another page's section reusing this shell */
  id: DegreeSectionId | (string & {})
  title: string
  children: ReactNode
  first?: boolean
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      // Clears the site header (and the mobile section bar) on a jump
      className={cn(
        'scroll-mt-32 lg:scroll-mt-24',
        !first && 'mt-10 border-t border-border pt-8'
      )}
    >
      <h2
        id={`${id}-title`}
        className="mb-4 text-xl font-semibold text-foreground"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Stat({
  value,
  label,
  note,
  info
}: {
  value: string
  label: string
  note?: string | null
  /** What the figure measures, behind an (i) next to the label */
  info?: string
}) {
  return (
    <div className="rounded-lg bg-muted px-4 py-3">
      <div className="text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {info && (
          <InfoPopover
            content={info}
            label={info}
            className="[&_svg]:size-3.5"
          />
        )}
      </div>
      {note && (
        <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>
      )}
    </div>
  )
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {children}
    </div>
  )
}

export function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 text-base font-semibold text-foreground">
      {children}
    </h3>
  )
}

/** A link out to the page a figure comes from, tracked by source. */
/** A click out to a source (DGES, InfoCursos, fee page, map, campus site) */
function trackSource(track: DegreeTrack, source: DegreeSourceLink) {
  if (track.facultySlug && track.degreeSlug) {
    analytics.discovery.degreeSourceLinkClicked({
      facultySlug: track.facultySlug,
      degreeSlug: track.degreeSlug,
      source
    })
  }
}

export function SourceLink({
  href,
  source,
  track,
  children
}: {
  href: string
  source: DegreeSourceLink
  track: DegreeTrack
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primaryBlue hover:underline"
      onClick={() => trackSource(track, source)}
    >
      {children}
    </a>
  )
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function DegreeHeader({
  degree,
  facultyName,
  universityName,
  courseCount,
  isRetired,
  coursesHref,
  onCoursesClick
}: {
  degree: Degree
  facultyName: string
  universityName: string | null
  courseCount: number
  /** Every course has left the plan: the degree is no longer taught */
  isRetired: boolean
  /** The degree's course browser (/cadeiras) */
  coursesHref: string | null
  onCoursesClick: () => void
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()

  // Facts about the degree only (what it is, how long, how big, in what
  // language); campus, schedule and course stats live in their sections
  const facts: ReactNode[] = [
    <b key="type">{t(`degree_page.facts.type.${degree.type}`)}</b>
  ]
  const semesters = degree.durationSemesters
  if (semesters) {
    facts.push(
      semesters % 2 === 0 ? (
        <span key="duration">
          <b>
            {t('degree_page.facts.years', {
              count: semesters / 2,
              n: formatNumber(semesters / 2, lang)
            })}
          </b>
          {' · '}
          {t('degree_page.facts.semesters', {
            count: semesters,
            n: formatNumber(semesters, lang)
          })}
        </span>
      ) : (
        <b key="duration">
          {t('degree_page.facts.semesters', {
            count: semesters,
            n: formatNumber(semesters, lang)
          })}
        </b>
      )
    )
  }
  if (degree.ects) {
    facts.push(
      <span key="ects">
        {t('degree_page.facts.ects', {
          count: degree.ects,
          n: formatNumber(degree.ects, lang)
        })}
      </span>
    )
  }
  if (degree.teachingLanguage) {
    const language = t(
      `degree_page.facts.language.${degree.teachingLanguage}`,
      { defaultValue: '' }
    )
    if (language) facts.push(<span key="language">{language}</span>)
  }

  return (
    <header className="mb-8">
      <h1 className="text-2xl font-bold leading-tight text-foreground text-balance md:text-3xl">
        {degree.name}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {universityName ? `${facultyName} · ${universityName}` : facultyName}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {facts.map((fact, i) => (
          <li
            key={i}
            className="whitespace-nowrap rounded-full bg-muted px-3 py-1 text-sm text-foreground"
          >
            {fact}
          </li>
        ))}
      </ul>
      {isRetired && (
        <p
          role="note"
          className="mt-4 rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground"
        >
          {t('degree_page.retired_notice')}
        </p>
      )}
      {courseCount > 0 && coursesHref && (
        <Link
          to={coursesHref}
          onClick={onCoursesClick}
          className="mt-5 inline-flex h-10 items-center rounded-md bg-brand-solid px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t('degree_page.view_courses', {
            count: courseCount,
            n: formatNumber(courseCount, lang)
          })}
        </Link>
      )}
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* Sobre o curso                                                       */
/* ------------------------------------------------------------------ */

export function AboutSection({
  about,
  track
}: {
  /** Reviewed text, possibly the Portuguese fallback on an EN page */
  about: Localized<string>
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const { t: tCommon } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  // Shown until measured, so the server render offers it; hidden after
  // hydration when the text fits anyway
  const [overflows, setOverflows] = useState(true)

  useEffect(() => {
    const el = contentRef.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 4)
  }, [about.value])

  const clamped = overflows && !expanded

  return (
    <SectionShell id="sobre" title={t('degree_page.sections.about')} first>
      <div
        ref={contentRef}
        lang={about.lang}
        className={cn(
          'max-w-prose',
          clamped &&
            'max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_65%,transparent)]'
        )}
      >
        <Markdown>{about.value}</Markdown>
      </div>
      {about.fellBack && (
        <p className="mt-1 text-xs text-muted-foreground">
          {tCommon('localized.pt_only')}
        </p>
      )}
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            const next = !expanded
            setExpanded(next)
            if (track.facultySlug && track.degreeSlug) {
              analytics.discovery.degreeAboutToggled({
                facultySlug: track.facultySlug,
                degreeSlug: track.degreeSlug,
                expanded: next
              })
            }
          }}
          className="mt-2 text-sm font-semibold text-primaryBlue hover:underline"
        >
          {expanded ? t('degree_page.show_less') : t('degree_page.show_more')}
        </button>
      )}
      <div className="mt-4">
        <ReportErrorNote
          surface="degree_about"
          align="left"
          pageName={track.pageName}
          facultySlug={track.facultySlug}
          degreeSlug={track.degreeSlug}
        />
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Ingresso                                                            */
/* ------------------------------------------------------------------ */

/**
 * The headline admission figures (last grade, vagas, candidatos, média dos
 * colocados), shared by the degree page's Ingresso section and `/ingresso`.
 */
export function useAdmissionStats(
  admissions: DegreeAdmissions | null
): ReactNode[] {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const { latest, previous } = latestGrades(admissions)
  const guide = admissions?.guide ?? null

  const stats: ReactNode[] = []
  if (latest) {
    stats.push(
      <Stat
        key="last"
        value={formatGrade(latest.grade, lang)}
        label={t('degree_page.admission.last_grade', { year: latest.year })}
        note={
          previous
            ? t('degree_page.admission.previous', {
                grade: formatGrade(previous.grade, lang),
                year: previous.year
              })
            : null
        }
      />
    )
  }
  if (guide?.nextYearVagas) {
    stats.push(
      <Stat
        key="vagas"
        value={formatInt(guide.nextYearVagas.vagas, lang)}
        label={t('degree_page.admission.vagas', {
          year: formatAcademicYear(guide.nextYearVagas.academicYear)
        })}
      />
    )
  }
  const fase1 = guide?.latestFase1
  if (fase1?.candidatos) {
    stats.push(
      <Stat
        key="candidatos"
        value={formatInt(fase1.candidatos, lang)}
        label={t('degree_page.admission.candidatos', { year: fase1.year })}
        note={
          fase1.candidatosFirstOption !== null
            ? t('degree_page.admission.first_option', {
                count: fase1.candidatosFirstOption,
                n: formatNumber(fase1.candidatosFirstOption, lang)
              })
            : null
        }
      />
    )
  }
  if (fase1?.mediaColocados) {
    stats.push(
      <Stat
        key="media"
        value={formatGrade(fase1.mediaColocados, lang)}
        label={t('degree_page.admission.media', { year: fase1.year })}
      />
    )
  }

  return stats
}

/** Provas de ingresso, fórmula and mínimos from the DGES guide. */
export function AdmissionRules({
  guide,
  showTitle = true
}: {
  guide: DegreeAdmissions['guide']
  showTitle?: boolean
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  if (!guide) return null
  const minimum = guide.minimumGrades
  const formatMin = (v: number) => formatInt(Math.round(v), lang)

  return (
    <>
      {guide.provas.length > 0 && (
        <>
          {showTitle && (
            <SubHeading>{t('degree_page.admission.exams_title')}</SubHeading>
          )}
          {guide.provas.length > 1 && (
            <p className="mb-2 text-sm text-muted-foreground">
              {t('degree_page.admission.exams_one_of')}
            </p>
          )}
          <ul className="flex flex-wrap gap-2">
            {guide.provas.map((combo) => (
              <li
                key={combo.join('+')}
                className="rounded-md border border-border px-2.5 py-1.5 text-sm"
              >
                {combo.join(' + ')}
              </li>
            ))}
          </ul>
        </>
      )}

      {(guide.formula ||
        minimum.application != null ||
        minimum.entryExams != null) && (
        <p className="mt-3 text-sm">
          {guide.formula && (
            <Trans
              t={t}
              i18nKey="degree_page.admission.formula"
              values={{
                secondary: formatInt(guide.formula.secondaryPct, lang),
                exams: formatInt(guide.formula.examsPct, lang)
              }}
              components={{ b: <b /> }}
            />
          )}{' '}
          {minimum.application != null && minimum.entryExams != null ? (
            <Trans
              t={t}
              i18nKey="degree_page.admission.minimum_both"
              values={{
                application: formatMin(minimum.application),
                exams: formatMin(minimum.entryExams)
              }}
              components={{ b: <b /> }}
            />
          ) : minimum.application != null ? (
            <Trans
              t={t}
              i18nKey="degree_page.admission.minimum_application"
              values={{ application: formatMin(minimum.application) }}
              components={{ b: <b /> }}
            />
          ) : minimum.entryExams != null ? (
            <Trans
              t={t}
              i18nKey="degree_page.admission.minimum_exams"
              values={{ exams: formatMin(minimum.entryExams) }}
              components={{ b: <b /> }}
            />
          ) : null}
        </p>
      )}
    </>
  )
}

/** "Ver tudo sobre o ingresso →": from a degree page section to its sub-page */
export function SubpageLink({
  href,
  page,
  label,
  track
}: {
  href: string
  page: 'admission' | 'careers'
  label: string
  track: DegreeTrack
}) {
  return (
    <Link
      to={href}
      onClick={() => {
        if (track.facultySlug && track.degreeSlug) {
          analytics.discovery.degreeSubpageLinkClicked({
            facultySlug: track.facultySlug,
            degreeSlug: track.degreeSlug,
            page,
            surface: 'section'
          })
        }
      }}
      className="mt-5 inline-flex items-center gap-1.5 font-semibold text-primaryBlue hover:underline"
    >
      {label}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  )
}

export function AdmissionSection({
  admissions,
  fees,
  feesExpected,
  admissionExpected,
  schoolYear,
  fullHref,
  track
}: {
  admissions: DegreeAdmissions | null
  fees: DegreeFees | null
  /** Show the fallback line when the fees are missing */
  feesExpected: boolean
  /** Show the fallback line when the Concurso Nacional data is missing */
  admissionExpected: boolean
  schoolYear: number
  /** The degree's `/ingresso` sub-page, which carries the full detail */
  fullHref?: string | null
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const guide = admissions?.guide ?? null
  const series = admissions?.main.series ?? []
  const stats = useAdmissionStats(admissions)

  const hasAdmission = stats.length > 0 || (guide?.provas.length ?? 0) > 0

  return (
    <SectionShell id="ingresso" title={t('degree_page.sections.admission')}>
      {hasAdmission ? (
        <>
          {stats.length > 0 && <StatGrid>{stats}</StatGrid>}

          {series.length > 1 && (
            <>
              <SubHeading>{t('degree_page.admission.chart_title')}</SubHeading>
              <AdmissionChart
                series={series}
                lang={lang}
                label={t('degree_page.admission.chart_label', {
                  from: series[0].year,
                  to: series[series.length - 1].year
                })}
              />
              {!fullHref && (
                <details
                  className="mt-2 text-sm"
                  onToggle={(event) => {
                    if (
                      (event.currentTarget as HTMLDetailsElement).open &&
                      track.facultySlug &&
                      track.degreeSlug
                    ) {
                      analytics.discovery.degreeAdmissionTableOpened({
                        facultySlug: track.facultySlug,
                        degreeSlug: track.degreeSlug
                      })
                    }
                  }}
                >
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    {t('degree_page.admission.table_toggle')}
                  </summary>
                  <table className="mt-2 w-full max-w-sm text-left tabular-nums">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-1.5 font-medium">
                          {t('degree_page.admission.table_year')}
                        </th>
                        <th className="py-1.5 font-medium">
                          {t('degree_page.admission.table_grade')}
                        </th>
                        <th className="py-1.5 font-medium">
                          {t('degree_page.admission.table_vagas')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...series].reverse().map((p) => (
                        <tr key={p.year} className="border-b border-border">
                          <td className="py-1.5">{p.year}</td>
                          <td className="py-1.5">
                            {formatGrade(p.grade, lang)}
                          </td>
                          <td className="py-1.5">
                            {p.vagas !== null ? formatInt(p.vagas, lang) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
            </>
          )}

          {admissions?.afterWork.map((trackData) => {
            const last = trackData.series.at(-1)
            if (!last) return null
            const params = {
              grade: formatGrade(last.grade, lang),
              year: last.year,
              vagas: last.vagas
            }
            return (
              <p key={trackData.courseCode} className="mt-3 text-sm">
                {last.vagas !== null
                  ? t('degree_page.admission.after_work_vagas', params)
                  : t('degree_page.admission.after_work', params)}
              </p>
            )
          })}

          <AdmissionRules guide={guide} />
        </>
      ) : (
        admissionExpected && (
          <ContributeNote
            field="admission"
            text={t('degree_page.admission.missing')}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )
      )}

      {fees ? (
        <>
          <SubHeading>
            {t('degree_page.fees.title', {
              year: formatSchoolYear(fees.schoolYear)
            })}
          </SubHeading>
          <StatGrid>
            {fees.rows.map((row) => (
              <Stat
                key={`${row.studentType}-${row.period}`}
                value={formatEur(row.amountEur, lang)}
                label={t('degree_page.fees.label', {
                  period: t(`degree_page.fees.period.${row.period}`, {
                    defaultValue: row.period
                  }),
                  student: t(`degree_page.fees.student.${row.studentType}`, {
                    defaultValue: row.studentType
                  })
                })}
              />
            ))}
          </StatGrid>
        </>
      ) : (
        feesExpected && (
          <ContributeNote
            className="mt-4"
            field="fees"
            text={t('degree_page.fees.missing', {
              year: formatSchoolYear(schoolYear)
            })}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )
      )}

      {(hasAdmission || fees) && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t('degree_page.source_label')}{' '}
          {admissions && hasAdmission && (
            <>
              <SourceLink href={admissions.dgesUrl} source="dges" track={track}>
                {series.length > 1
                  ? t('degree_page.admission.source_years', {
                      from: series[0].year,
                      to: series[series.length - 1].year
                    })
                  : t('degree_page.admission.source_dges')}
              </SourceLink>
              {fees && ' · '}
            </>
          )}
          {fees?.sourceUrls.map((url, i) => (
            <span key={url}>
              {i > 0 && ' · '}
              <SourceLink href={url} source="fees" track={track}>
                {`${hostOf(url)}, ${t('degree_page.fees.source', {
                  year: formatSchoolYear(fees.schoolYear)
                })}`}
              </SourceLink>
            </span>
          ))}
        </p>
      )}
      {fullHref && (
        <SubpageLink
          href={fullHref}
          page="admission"
          label={t('degree_subpages.see_admission')}
          track={track}
        />
      )}
      {(hasAdmission || fees) && (
        <div className="mt-3">
          <ReportErrorNote
            surface="degree_admission"
            align="left"
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        </div>
      )}
    </SectionShell>
  )
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/* ------------------------------------------------------------------ */
/* Depois do curso                                                     */
/* ------------------------------------------------------------------ */

/**
 * Employability, completion and "still in the course" figures, shared by the
 * degree page's "Depois do curso" and `/saidas-profissionais`.
 */
export function useOutcomeStats(outcomes: DegreeOutcomes | null): ReactNode[] {
  const { t } = useTranslation('browse')
  const lang = useLang()

  const stats: ReactNode[] = []
  const u = outcomes?.unemployment
  if (u) {
    const national = u.national !== null ? formatPct(u.national, lang) : null
    const area = u.area !== null ? formatPct(u.area, lang) : null
    // Framed positively, and only as far as the data goes: InfoCursos counts graduates
    // registered as unemployed (IEFP), so the complement is "not unemployed", not "employed"
    // (it also covers graduates studying further or abroad).
    const rate = formatPct(u.rate, lang)
    stats.push(
      <Stat
        key="unemployment"
        value={formatPct(Math.round((100 - u.rate) * 10) / 10, lang)}
        label={t('degree_page.outcomes.employability')}
        info={t('degree_page.outcomes.employability_info')}
        note={
          national && area
            ? t('degree_page.outcomes.compare_both', { rate, national, area })
            : national
              ? t('degree_page.outcomes.compare_national', { rate, national })
              : area
                ? t('degree_page.outcomes.compare_area', { rate, area })
                : t('degree_page.outcomes.compare_none', { rate })
        }
      />
    )
  }
  const c = outcomes?.completion
  if (c?.expectedTime != null) {
    stats.push(
      <Stat
        key="completion"
        value={formatPct(c.expectedTime, lang)}
        label={t('degree_page.outcomes.completion')}
        note={
          c.plus3Years != null
            ? t('degree_page.outcomes.completion_plus3', {
                pct: formatPct(c.plus3Years, lang)
              })
            : null
        }
      />
    )
  } else if (c?.plus3Years != null) {
    stats.push(
      <Stat
        key="completion"
        value={formatPct(c.plus3Years, lang)}
        label={t('degree_page.outcomes.plus3_only')}
      />
    )
  }
  if (outcomes?.stillInCourse != null) {
    stats.push(
      <Stat
        key="still"
        value={formatPct(outcomes.stillInCourse, lang)}
        label={t('degree_page.outcomes.still_in_course')}
      />
    )
  }

  return stats
}

export function OutcomesSection({
  outcomes,
  showFallback,
  fullHref,
  track
}: {
  outcomes: DegreeOutcomes | null
  /** The "no data yet" line; off for a degree no longer taught */
  showFallback: boolean
  /** The degree's `/saidas-profissionais` sub-page */
  fullHref?: string | null
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const stats = useOutcomeStats(outcomes)

  return (
    <SectionShell id="depois" title={t('degree_page.sections.outcomes')}>
      {outcomes && stats.length > 0 ? (
        <>
          <StatGrid>{stats}</StatGrid>
          {outcomes.broaderProgramme && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t(
                `degree_page.outcomes.broader.${
                  outcomes.broaderProgramme.level === 'mestrado' ||
                  outcomes.broaderProgramme.level === 'licenciatura'
                    ? outcomes.broaderProgramme.level
                    : 'other'
                }`,
                { name: outcomes.broaderProgramme.name }
              )}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {t('degree_page.source_label')}{' '}
            <SourceLink
              href={outcomes.sourceUrl}
              source="infocursos"
              track={track}
            >
              {t('degree_page.outcomes.source', { edition: outcomes.edition })}
            </SourceLink>
          </p>
          <div className="mt-3">
            <ReportErrorNote
              surface="degree_outcomes"
              align="left"
              pageName={track.pageName}
              facultySlug={track.facultySlug}
              degreeSlug={track.degreeSlug}
            />
          </div>
        </>
      ) : (
        showFallback && (
          <ContributeNote
            field="outcomes"
            text={t('degree_page.outcomes.missing')}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )
      )}
      {fullHref && outcomes && (
        <SubpageLink
          href={fullHref}
          page="careers"
          label={t('degree_subpages.see_careers')}
          track={track}
        />
      )}
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* As cadeiras segundo os alunos                                       */
/* ------------------------------------------------------------------ */

function HighlightList({
  title,
  courses,
  value
}: {
  title: string
  courses: CourseWithFeedback[]
  value: (course: CourseWithFeedback) => ReactNode
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
              onClick={() =>
                analytics.discovery.courseCardClicked({
                  courseId: course.id,
                  sourcePage: getPageName(window.location.pathname),
                  positionInList: i
                })
              }
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

export function HighlightsSection({
  highlights,
  prompt
}: {
  highlights: CourseHighlights
  prompt: ReactNode
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const workloadLabel = useWorkloadLabel()

  return (
    <SectionShell id="destaques" title={t('degree_page.sections.highlights')}>
      <div className="grid gap-6 md:grid-cols-2">
        <HighlightList
          title={t('degree_page.highlights.best')}
          courses={highlights.best}
          value={(course) => (
            <span className="inline-flex items-center gap-1">
              <Star
                aria-hidden="true"
                className="size-3.5 fill-rating text-rating"
              />
              {formatGrade(Number(course.averageRating), lang)}
            </span>
          )}
        />
        <HighlightList
          title={t('degree_page.highlights.heaviest')}
          courses={highlights.heaviest}
          value={(course) => workloadLabel(Number(course.averageWorkload))}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {t('degree_page.highlights.hint', {
          count: HIGHLIGHT_MIN_FEEDBACK,
          n: formatNumber(HIGHLIGHT_MIN_FEEDBACK, lang)
        })}
      </p>
      {prompt}
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Campus                                                              */
/* ------------------------------------------------------------------ */

export function CampusSection({
  campuses,
  degree,
  showContribute,
  track
}: {
  campuses: DegreeCampusInfo[]
  degree: Degree
  /** The prompts for missing facts; off for a degree no longer taught */
  showContribute: boolean
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')

  return (
    <SectionShell id="campus" title={t('degree_page.sections.campus')}>
      {campuses.length > 0 ? (
        <CampusMap
          items={campuses.map((campus) => ({
            key: String(campus.id),
            title: campus.name,
            pinLabel: campus.name,
            address: campusAddress(campus),
            latitude: campus.latitude,
            longitude: campus.longitude,
            details:
              [campus.phone, campus.email].filter(Boolean).join(' · ') ||
              undefined,
            website: campus.url
              ? { href: campus.url, label: hostOf(campus.url) }
              : undefined
          }))}
          onSelect={(item, surface) => {
            if (!track.facultySlug || !track.degreeSlug) return
            analytics.discovery.campusSelected({
              page: 'degree',
              facultySlug: track.facultySlug,
              degreeSlug: track.degreeSlug,
              campus: item.title,
              surface
            })
          }}
          onDirections={() => trackSource(track, 'campus_map')}
          onWebsite={() => trackSource(track, 'campus_website')}
        />
      ) : (
        showContribute && (
          <ContributeNote
            field="campus"
            text={t('degree_page.campus.missing')}
            pageName={track.pageName}
            facultySlug={track.facultySlug}
            degreeSlug={track.degreeSlug}
          />
        )
      )}
      {showContribute && !degree.teachingLanguage && (
        <ContributeNote
          className="mt-3"
          field="teaching_language"
          text={t('degree_page.campus.language_missing')}
          pageName={track.pageName}
          facultySlug={track.facultySlug}
          degreeSlug={track.degreeSlug}
        />
      )}
      {showContribute && !degree.schedule && (
        <ContributeNote
          className="mt-1"
          field="schedule"
          text={t('degree_page.campus.schedule_missing')}
          pageName={track.pageName}
          facultySlug={track.facultySlug}
          degreeSlug={track.degreeSlug}
        />
      )}
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

/** Which page an FAQ sits on, for its "ask our chat" footer */
export type FaqSurface =
  | 'degree_page'
  | 'degree_admission_page'
  | 'degree_careers_page'
  | 'faculty_page'
  | 'faculty_type_page'
  | 'university_page'

export function FaqSection({
  items,
  surface,
  chatScope
}: {
  items: FaqItem[]
  surface: FaqSurface
  /** Scopes the chat to the degree the page is about */
  chatScope?: { degreeId: number; scopeLabel: string }
}) {
  const { t } = useTranslation('browse')
  return (
    <SectionShell id="faq" title={t('degree_page.sections.faq')}>
      <div>
        {items.map((item) => (
          <details
            key={item.question}
            className="group border-b border-border py-3"
          >
            <summary className="cursor-pointer list-none font-semibold text-foreground [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {item.question}
                <span
                  aria-hidden="true"
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            {item.isMarkdown ? (
              <div className="mt-2 text-muted-foreground">
                <Markdown>{item.answer}</Markdown>
              </div>
            ) : (
              <p className="mt-2 text-muted-foreground">{item.answer}</p>
            )}
          </details>
        ))}
      </div>
      <FaqChatFooter surface={surface} chatScope={chatScope} />
    </SectionShell>
  )
}

/**
 * "Tens outra pergunta? Pergunta ao nosso chat": the FAQ answers what we wrote
 * down, the chat what we didn't. Opens the chat empty (scoped to the degree on
 * degree pages); with the chat switched off, points to the contact page instead.
 */
function FaqChatFooter({
  surface,
  chatScope
}: {
  surface: FaqSurface
  chatScope?: { degreeId: number; scopeLabel: string }
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const { isAuthenticated } = useAuth()
  const showChat = useShowChatEntryPoints()

  const params = new URLSearchParams({ source: 'faq' })
  if (chatScope) {
    params.set('degreeId', String(chatScope.degreeId))
    params.set('scopeLabel', chatScope.scopeLabel)
  }
  const href = showChat
    ? `${getLocalePath('chat', lang)}?${params.toString()}`
    : getLocalePath('contact', lang)

  return (
    <p className="mt-4 text-sm text-muted-foreground">
      {t('degree_page.faq_footer.question')}{' '}
      <Link
        to={href}
        onClick={() =>
          analytics.chat.faqFooterClicked({
            surface,
            degreeId: chatScope?.degreeId ?? null,
            destination: showChat ? 'chat' : 'contact',
            isAuthenticated
          })
        }
        className="font-semibold text-primaryBlue hover:underline"
      >
        {showChat
          ? t('degree_page.faq_footer.chat')
          : t('degree_page.faq_footer.contact')}
      </Link>
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Relacionados                                                        */
/* ------------------------------------------------------------------ */

export function RelatedSection({
  related,
  track
}: {
  related: RelatedDegree[]
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  return (
    <SectionShell id="relacionados" title={t('degree_page.sections.related')}>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {related.map((r) => (
          <li key={`${r.relationship}-${r.facultySlug}-${r.slug}`}>
            <Link
              to={getDegreePath(lang, r.facultySlug, r.slug)}
              onClick={() => {
                if (track.facultySlug && track.degreeSlug) {
                  analytics.discovery.degreeRelatedClicked({
                    facultySlug: track.facultySlug,
                    degreeSlug: track.degreeSlug,
                    targetFacultySlug: r.facultySlug,
                    targetDegreeSlug: r.slug,
                    relationship: r.relationship
                  })
                }
              }}
              className="block h-full rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:border-primaryBlue"
            >
              <small className="block text-xs text-muted-foreground">
                {t(`degree_page.related.${r.relationship}`)}
              </small>
              <b className="block">
                {r.acronym} · {r.facultyShortName}
              </b>
              <span className="block text-sm text-muted-foreground">
                {r.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
