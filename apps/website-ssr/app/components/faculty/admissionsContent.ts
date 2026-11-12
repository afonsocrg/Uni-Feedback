import type { DegreeType } from '@uni-feedback/db/schema'
import type { TFunction } from 'i18next'
import {
  FACULTY_TYPE_SEGMENTS,
  isFacultyTypePage
} from '~/utils/facultyTypePages'
import {
  formatEur,
  formatIsoDay,
  formatIsoPeriod,
  formatSchoolYear,
  nextRound,
  type FaqItem
} from '../degree/content'
import type {
  AdmissionRoundView,
  AdmissionRouteScope,
  AdmissionRouteView
} from '../degree/pageTypes'
import { summarizeFees, type FeeSide, type FeeSummary } from './feesContent'
import type { FeesPageDegree } from './types'

/**
 * The faculty's Candidaturas page (`/:facultySlug/candidaturas`), shared by
 * the page, the hub's summary and each degree's Ingresso link: section ids,
 * labels and where each route stands today.
 */

/**
 * The anchor of a shared route's section on the Candidaturas page, from what
 * the rows are for, so a degree's Ingresso page can link straight to it
 * without loading the faculty's grouping: `mestrados`, `licenciaturas-
 * internacionais`, `concurso-nacional`. Portuguese in both languages, like
 * the Propinas page's section ids.
 */
export function applySectionId(
  route: AdmissionRouteView['route'],
  audience: AdmissionRouteView['audience'],
  scope: AdmissionRouteScope
): string {
  if (route === 'cna') return 'concurso-nacional'
  const base =
    scope.degreeType && isFacultyTypePage(scope.degreeType)
      ? FACULTY_TYPE_SEGMENTS[scope.degreeType].pt
      : route === 'special'
        ? 'concursos-especiais'
        : 'candidatura-direta'
  const suffix =
    audience === 'all'
      ? ''
      : audience === 'international'
        ? '-internacionais'
        : audience === 'national'
          ? '-nacionais'
          : '-internos'
  return `${base}${suffix}`
}

/** One shared route on the Candidaturas page, with the degrees it covers */
export interface FacultyApplySection {
  id: string
  route: AdmissionRouteView['route']
  audience: AdmissionRouteView['audience']
  /** The listed degrees this route covers, in table order */
  degrees: FacultyApplyDegree[]
  /** Their types, in DEGREE_TYPES order (the section's label) */
  types: DegreeType[]
  view: AdmissionRouteView
}

export interface FacultyApplyDegree {
  id: number
  type: DegreeType
  name: string
  acronym: string
  slug: string
}

/** A route that belongs to one degree alone: Ingresso has it in full */
export interface FacultyOwnRoute {
  degree: FacultyApplyDegree
  view: AdmissionRouteView
}

export interface FacultyApplyData {
  sections: FacultyApplySection[]
  ownRoutes: FacultyOwnRoute[]
  /** Today in Lisbon (ISO), the day the statuses are for */
  today: string
}

/** The page has something of the faculty's own, not only the national CNA */
export function hasAdmissionsPage(data: FacultyApplyData): boolean {
  return (
    data.ownRoutes.length > 0 ||
    data.sections.some((s) => s.view.scope.level !== 'national')
  )
}

/**
 * Indexed only with real content: a reviewed guide of the faculty's own
 * (requirements, fee, where to apply), not just dates or the national guide.
 */
export function isAdmissionsPageIndexable(data: FacultyApplyData): boolean {
  return data.sections.some(
    (s) => s.view.scope.level === 'faculty' && s.view.guide !== null
  )
}

/**
 * "Mestrados", "Licenciaturas: estudantes internacionais", "Licenciaturas e
 * mestrados integrados: Concurso Nacional de Acesso"
 */
export function applySectionLabel(
  t: TFunction<'browse'>,
  section: Pick<FacultyApplySection, 'route' | 'audience' | 'types'>
): string {
  const types = section.types.map((type) => t(`degree_types.${type}`))
  const typesLabel =
    types.length > 1
      ? t('faculty_admissions.types_join', {
          first: types.slice(0, -1).join(', '),
          last: types.at(-1)
        })
      : (types[0] ?? '')
  // Only the faculty's direct route for everyone goes by its types alone
  if (section.route === 'direct' && section.audience === 'all') {
    return typesLabel || t('degree_subpages.admission.apply.route.direct_all')
  }
  const routeLabel = t(
    `degree_subpages.admission.apply.route.${section.route}_${section.audience}`,
    {
      defaultValue: t(
        `degree_subpages.admission.apply.route.${section.route}_all`
      )
    }
  )
  if (!typesLabel) return routeLabel
  // Lower case after the colon, except a name ("Concurso Nacional de Acesso")
  const route =
    section.route === 'cna'
      ? routeLabel
      : routeLabel.charAt(0).toLowerCase() + routeLabel.slice(1)
  return t('faculty_admissions.section_label', { types: typesLabel, route })
}

export type ApplyStatus = 'open' | 'upcoming' | 'closed' | 'none'

/** Where a route stands: its next round, or the last intake closed */
export function applyStatus(view: AdmissionRouteView): {
  status: ApplyStatus
  next: AdmissionRoundView | undefined
} {
  const next = nextRound(view.rounds)
  return {
    status:
      next?.status === 'open'
        ? 'open'
        : next
          ? 'upcoming'
          : view.rounds.length > 0
            ? 'closed'
            : 'none',
    next
  }
}

/**
 * One short line for summaries (the hub, the Resumo tiles): "Abertas até 25
 * de novembro", "Abrem a 6 de janeiro", "Encerradas"; null with no rounds.
 */
export function applyStatusShort(
  t: TFunction<'browse'>,
  lang: 'pt' | 'en',
  view: AdmissionRouteView
): string | null {
  const { status, next } = applyStatus(view)
  if (status === 'open') {
    return next?.closesOn
      ? t('faculty_admissions.status.open', {
          date: formatIsoDay(next.closesOn, lang)
        })
      : t('faculty_admissions.status.open_nodate')
  }
  if (status === 'upcoming') {
    return next?.opensOn
      ? t('faculty_admissions.status.upcoming', {
          date: formatIsoDay(next.opensOn, lang)
        })
      : t('faculty_admissions.status.upcoming_nodate')
  }
  if (status === 'closed') return t('faculty_admissions.status.closed')
  return null
}

/** The intake the page is mostly about: the latest one any section shows */
export function latestIntake(data: FacultyApplyData): number | null {
  const years = data.sections
    .map((s) => s.view.schoolYear)
    .filter((y): y is number => y !== null)
  return years.length > 0 ? Math.max(...years) : null
}

/** Questions answered from the rounds and guides (FAQPage on the page) */
export function buildAdmissionsFaq(
  t: TFunction<'browse'>,
  lang: 'pt' | 'en',
  facultyName: string,
  data: FacultyApplyData
): FaqItem[] {
  const items: FaqItem[] = []
  const period = (r: AdmissionRoundView) =>
    formatIsoPeriod(r.opensOn, r.closesOn, lang, {
      until: (date) => t('degree_subpages.admission.apply.until', { date }),
      from: (date) => t('degree_subpages.admission.apply.from', { date })
    })
  for (const section of data.sections) {
    const { view } = section
    if (view.scope.level === 'national') continue
    const label = applySectionLabel(t, section)
    if (view.rounds.length > 0 && view.schoolYear !== null) {
      const status = applyStatusShort(t, lang, view)
      items.push({
        topic: `application_dates_${section.id}`,
        isMarkdown: false,
        question: t('faculty_admissions.faq.dates_q', {
          label,
          name: facultyName
        }),
        answer: [
          t('faculty_admissions.faq.dates_a', {
            year: formatSchoolYear(view.schoolYear),
            count: view.rounds.length,
            rounds: view.rounds
              .map((r) => `${r.label} (${period(r)})`)
              .join('; ')
          }),
          status ? `${status}.` : null
        ]
          .filter(Boolean)
          .join(' ')
      })
    }
    const fee = view.guide?.applicationFee
    if (fee) {
      items.push({
        topic: `application_fee_${section.id}`,
        isMarkdown: false,
        question: t('faculty_admissions.faq.fee_q', {
          label,
          name: facultyName
        }),
        answer: t(
          fee.note
            ? 'faculty_admissions.faq.fee_a_note'
            : 'faculty_admissions.faq.fee_a',
          { fee: formatEur(fee.amountEur, lang), note: fee.note }
        )
      })
    }
  }
  return items
}

/**
 * The tuition line under a route's section: what its degrees cost for the
 * side the route is for (international routes: the international fee), next
 * year's when already published (the intake applicants are applying for),
 * else this year's. One amount when they all cost the same, else a range;
 * `summary` null when the periods don't compare (per year and total); null
 * with no fee at all.
 */
export function sectionTuition(
  section: Pick<FacultyApplySection, 'audience' | 'degrees'>,
  fees: { schoolYear: number; degrees: FeesPageDegree[] }
): { schoolYear: number; summary: FeeSummary | null } | null {
  const ids = new Set(section.degrees.map((d) => d.id))
  const degrees = fees.degrees.filter((d) => ids.has(d.id))
  const side: FeeSide =
    section.audience === 'international' ? 'international' : 'national'
  const next = summarizeFees(degrees, side, 'next')
  // Next year's only when every degree with a fee already has it
  const current = summarizeFees(degrees, side)
  if (next && current && next.count >= current.count) {
    return { schoolYear: fees.schoolYear + 1, summary: next }
  }
  if (current) return { schoolYear: fees.schoolYear, summary: current }
  // Fees in periods that don't compare (per year and per degree): no
  // figure, only the way to the table
  return degrees.some((d) => d[side].length > 0)
    ? { schoolYear: fees.schoolYear, summary: null }
    : null
}
