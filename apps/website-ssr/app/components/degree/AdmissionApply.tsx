import { cn, Markdown } from '@uni-feedback/ui'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { ReportErrorNote } from '../common/ReportErrorNote'
import { AdmissionTimeline } from './AdmissionTimeline'
import { formatIsoDay, formatSchoolYear, nextRound } from './content'
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
 * application. Statuses come from the loader (Lisbon date), so server and
 * client render the same thing.
 */
export function AdmissionApply({
  routes,
  today,
  track
}: {
  routes: AdmissionRouteView[]
  /** The loader's Lisbon date, the day the statuses are for */
  today: string
  track: DegreeTrack
}) {
  const { t } = useTranslation('browse')
  return (
    <div className="space-y-10">
      {routes.map((route) => (
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

function ApplyRoute({
  route,
  today,
  track,
  showHeading
}: {
  route: AdmissionRouteView
  today: string
  track: DegreeTrack
  showHeading: boolean
}) {
  const { t } = useTranslation('browse')
  const next = nextRound(route.rounds)
  // The application portal only while a round is open; otherwise the page
  // with the rules and dates
  const isOpen = next?.status === 'open'
  // The guide's own source first: it is in the page's language
  const infoUrl =
    route.guide?.sourceUrls[0] ??
    route.roundsSourceUrl ??
    route.guide?.applyUrl ??
    null
  const linkKind: 'apply' | 'info' =
    isOpen && route.guide?.applyUrl ? 'apply' : 'info'
  const linkUrl = linkKind === 'apply' ? route.guide!.applyUrl! : infoUrl
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
            if (!track.facultySlug || !track.degreeSlug) return
            analytics.discovery.degreeApplyLinkClicked({
              facultySlug: track.facultySlug,
              degreeSlug: track.degreeSlug,
              route: route.route,
              audience: route.audience,
              kind: linkKind,
              roundStatus: isOpen
                ? 'open'
                : next
                  ? 'upcoming'
                  : route.rounds.length > 0
                    ? 'closed'
                    : 'none'
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

function StatusLine({
  route,
  next
}: {
  route: AdmissionRouteView
  next: AdmissionRoundView | undefined
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
        'mb-3 flex items-baseline gap-2',
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
