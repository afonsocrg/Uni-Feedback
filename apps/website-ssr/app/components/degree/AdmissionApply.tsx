import { cn, Markdown } from '@uni-feedback/ui'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { getFacultyAdmissionsPath } from '~/utils/i18n-routes'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { AdmissionTimeline } from './AdmissionTimeline'
import {
  formatIsoDay,
  formatIsoPeriod,
  formatSchoolYear,
  nextRound
} from './content'
import {
  hostOf,
  SourceLink,
  SubHeading,
  type DegreeTrack
} from './DegreeSections'
import type { AdmissionRoundView, AdmissionRouteView } from './pageTypes'

/**
 * "Como te candidatas" on the Ingresso page (prds/content_rich_pages.md,
 * "Ingresso v2"): per route into the degree, where the rounds stand today, the
 * rounds of the latest intake, our guide, and the way out to the official
 * application. A route shared with other degrees lives on the faculty's
 * Candidaturas page: here it is its status and a link there, so the calendar
 * and guide aren't copied onto every degree. Statuses come from the loader
 * (Lisbon date), so server and client render the same thing.
 */
export function AdmissionApply({
  routes,
  today,
  track,
  facultyShortName
}: {
  routes: AdmissionRouteView[]
  /** The loader's Lisbon date, the day the statuses are for */
  today: string
  track: DegreeTrack
  facultyShortName: string
}) {
  const { t } = useTranslation('browse')
  const facultySlug = track.facultySlug
  const shared = facultySlug ? routes.filter((r) => r.facultySectionId) : []
  const own = routes.filter((r) => !shared.includes(r))
  return (
    <div className="space-y-10">
      {facultySlug && shared.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shared.map((route) => (
            <li key={`${route.route}-${route.audience}`}>
              <SharedRouteCard
                route={route}
                sectionId={route.facultySectionId!}
                facultySlug={facultySlug}
                facultyShortName={facultyShortName}
                track={track}
              />
            </li>
          ))}
        </ul>
      )}
      {own.map((route) => (
        <ApplyRoute
          key={`${route.route}-${route.audience}`}
          route={route}
          today={today}
          track={track}
          showHeading={routes.length > 1}
        />
      ))}
      <ReportErrorNote
        align="left"
        surface="degree_admission_apply"
        pageName={`${track.pageName}, ${t('degree_subpages.admission.apply.title')}`}
        facultySlug={track.facultySlug}
        degreeSlug={track.degreeSlug}
        text={t('degree_subpages.admission.apply.report_text')}
      />
    </div>
  )
}

/**
 * One route in full: status, timeline, guide, link out and sources. Also the
 * body of each section on the faculty's Candidaturas page, which passes its
 * own `onLinkClick` (its analytics are per faculty, not per degree).
 */
export function ApplyRoute({
  route,
  today,
  track,
  showHeading,
  onLinkClick
}: {
  route: AdmissionRouteView
  today: string
  track: DegreeTrack
  showHeading: boolean
  onLinkClick?: (
    kind: 'apply' | 'info',
    roundStatus: 'open' | 'upcoming' | 'closed' | 'none'
  ) => void
}) {
  const { t } = useTranslation('browse')
  const next = nextRound(route.rounds)
  const { kind: linkKind, url: linkUrl, roundStatus } = applyLink(route)
  // One link per site: the rounds' page first, then the guide's sources
  const sources = [
    ...new Map(
      [
        ...(route.roundsSourceUrl ? [route.roundsSourceUrl] : []),
        ...(route.guide?.sourceUrls ?? [])
      ].map((url) => [hostOf(url), url])
    ).values()
  ]

  return (
    <div>
      {showHeading && (
        <SubHeading>
          {t(
            `degree_subpages.admission.apply.route.${route.route}_${route.audience}`,
            {
              defaultValue: t(
                `degree_subpages.admission.apply.route.${route.route}_all`
              )
            }
          )}
        </SubHeading>
      )}

      {route.rounds.length > 0 && (
        <>
          <StatusLine route={route} next={next} />
          {route.schoolYear !== null && (
            <p className="mb-2 text-xs text-muted-foreground">
              {t('degree_subpages.admission.apply.intake', {
                year: formatSchoolYear(route.schoolYear)
              })}
            </p>
          )}
          <AdmissionTimeline rounds={route.rounds} today={today} />
        </>
      )}

      {route.guide && (
        <div className="mt-4 max-w-prose">
          <Markdown>{route.guide.body}</Markdown>
        </div>
      )}

      {linkUrl && (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 font-semibold text-primaryBlue hover:underline"
          onClick={() => {
            if (onLinkClick) {
              onLinkClick(linkKind, roundStatus)
              return
            }
            if (!track.facultySlug || !track.degreeSlug) return
            analytics.discovery.degreeApplyLinkClicked({
              facultySlug: track.facultySlug,
              degreeSlug: track.degreeSlug,
              route: route.route,
              audience: route.audience,
              kind: linkKind,
              roundStatus
            })
          }}
        >
          {t(
            linkKind === 'apply'
              ? 'degree_subpages.admission.apply.button'
              : 'degree_subpages.admission.apply.button_info',
            { host: hostOf(linkUrl) }
          )}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      )}

      {sources.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {t('degree_subpages.admission.apply.sources')}{' '}
          {sources.map((url, i) => (
            <span key={url}>
              {i > 0 && ' · '}
              <SourceLink href={url} source="admissions" track={track}>
                {hostOf(url)}
              </SourceLink>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

/**
 * The way out of a route: the application portal while a round is open,
 * otherwise the page with the rules and dates (the guide's own source first,
 * as it is in the page's language). Shared by the full block and the card.
 */
function applyLink(route: AdmissionRouteView): {
  kind: 'apply' | 'info'
  url: string | null
  roundStatus: 'open' | 'upcoming' | 'closed' | 'none'
} {
  const next = nextRound(route.rounds)
  const isOpen = next?.status === 'open'
  const kind = isOpen && route.guide?.applyUrl ? 'apply' : 'info'
  return {
    kind,
    url:
      kind === 'apply'
        ? route.guide!.applyUrl!
        : (route.guide?.sourceUrls[0] ??
          route.roundsSourceUrl ??
          route.guide?.applyUrl ??
          null),
    roundStatus: isOpen
      ? 'open'
      : next
        ? 'upcoming'
        : route.rounds.length > 0
          ? 'closed'
          : 'none'
  }
}

/**
 * A route shared with the faculty's other degrees, as a card: where it stands,
 * the round in play (which of how many, its dates, when the next opens), a
 * link to its section on the faculty's Candidaturas page, which has the
 * calendar and requirements (so they aren't copied here), and under it, muted,
 * the official page (the portal while a round is open). The
 * application fee is already in the page's Resumo.
 */
function SharedRouteCard({
  route,
  sectionId,
  facultySlug,
  facultyShortName,
  track
}: {
  route: AdmissionRouteView
  sectionId: string
  facultySlug: string
  facultyShortName: string
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const next = nextRound(route.rounds)
  const link = applyLink(route)
  const trackClick = (kind: 'apply' | 'info' | 'faculty_page') => {
    if (!track.degreeSlug) return
    analytics.discovery.degreeApplyLinkClicked({
      facultySlug,
      degreeSlug: track.degreeSlug,
      route: route.route,
      audience: route.audience,
      kind,
      roundStatus: link.roundStatus
    })
  }

  // "1.ª ronda (1 de 5) · 11–25 nov 2026 · a seguinte abre a 25 nov 2026"
  const context: string[] = []
  if (next) {
    const index = route.rounds.indexOf(next)
    context.push(
      route.rounds.length > 1
        ? t('degree_subpages.admission.apply.card.round_of', {
            label: next.label,
            n: index + 1,
            count: route.rounds.length
          })
        : next.label
    )
    context.push(
      formatIsoPeriod(next.opensOn, next.closesOn, lang, {
        until: (date) => t('degree_subpages.admission.apply.until', { date }),
        from: (date) => t('degree_subpages.admission.apply.from', { date })
      })
    )
    const following = route.rounds[index + 1]
    if (next.status === 'open' && following?.opensOn) {
      context.push(
        t('degree_subpages.admission.apply.card.next_opens', {
          date: formatIsoDay(following.opensOn, lang)
        })
      )
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border px-4 py-3">
      <p className="mb-2 text-sm font-semibold text-foreground">
        {t(
          `degree_subpages.admission.apply.route.${route.route}_${route.audience}`,
          {
            defaultValue: t(
              `degree_subpages.admission.apply.route.${route.route}_all`
            )
          }
        )}
      </p>
      {route.rounds.length > 0 && (
        <StatusLine route={route} next={next} className="mb-1" />
      )}
      {context.length > 0 && (
        <p className="pl-4 text-sm text-muted-foreground">
          {context.join(' · ')}
        </p>
      )}
      {/* Our page first; the official one under it, muted */}
      <div className="mt-auto space-y-1 pt-4">
        <Link
          to={getFacultyAdmissionsPath(lang, facultySlug, sectionId)}
          onClick={() => trackClick('faculty_page')}
          aria-label={t('degree_subpages.admission.apply.shared_link_label', {
            faculty: facultyShortName
          })}
          className="inline-flex items-center gap-1 font-semibold text-primaryBlue hover:underline"
        >
          {t('degree_subpages.admission.apply.shared_link')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        {link.url && (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(link.kind)}
            className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {t(
              link.kind === 'apply'
                ? 'degree_subpages.admission.apply.button'
                : 'degree_subpages.admission.apply.button_info',
              { host: hostOf(link.url) }
            )}
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export function StatusLine({
  route,
  next,
  className = 'mb-3'
}: {
  route: AdmissionRouteView
  next: AdmissionRoundView | undefined
  className?: string
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  let text: string
  let tone: 'open' | 'upcoming' | 'closed'
  if (next?.status === 'open') {
    tone = 'open'
    text = next.closesOn
      ? t('degree_subpages.admission.apply.status_open', {
          date: formatIsoDay(next.closesOn, lang)
        })
      : t('degree_subpages.admission.apply.status_open_nodate')
  } else if (next) {
    tone = 'upcoming'
    text = next.opensOn
      ? t('degree_subpages.admission.apply.status_upcoming', {
          label: lowerFirst(next.label),
          date: formatIsoDay(next.opensOn, lang)
        })
      : t('degree_subpages.admission.apply.status_upcoming_nodate', {
          label: lowerFirst(next.label)
        })
  } else {
    if (route.schoolYear === null) return null
    tone = 'closed'
    text = t('degree_subpages.admission.apply.status_closed', {
      year: formatSchoolYear(route.schoolYear),
      next: formatSchoolYear(route.schoolYear + 1)
    })
  }
  return (
    // Body text with a dot for the state, like the rest of the page (no box)
    <p
      className={cn(
        'flex items-baseline gap-2',
        className,
        tone === 'closed' && 'text-muted-foreground'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 -translate-y-px rounded-full',
          tone === 'open' && 'bg-success',
          tone === 'upcoming' && 'bg-brand-solid',
          tone === 'closed' && 'bg-muted-foreground/40'
        )}
      />
      <span>{text}</span>
    </p>
  )
}

/** "Candidatura de primavera" inside a sentence: "a candidatura de primavera" */
function lowerFirst(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1)
}
