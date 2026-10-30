import { cn } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import {
  formatIsoPeriod,
  formatIsoShortDate,
  formatIsoShortDay,
  formatIsoShortRange
} from './content'
import type { AdmissionRoundView } from './pageTypes'

/**
 * The rounds of one intake as a timeline (Ingresso page, "Como candidatar-se").
 * From `sm` up, a horizontal track: the rounds, their results dates and today
 * as evenly spaced steps in date order (not to scale), with the dates below.
 * On phones, a vertical list with one marker per round, which is also what
 * screen readers get at every width. `today` is the loader's Lisbon date, so server and
 * client place the marker on the same day.
 */
export function AdmissionTimeline({
  rounds,
  today
}: {
  rounds: AdmissionRoundView[]
  today: string
}) {
  return (
    <>
      <HorizontalTrack rounds={rounds} today={today} />
      <VerticalList rounds={rounds} today={today} />
    </>
  )
}

const DAY = 86_400_000
// Today shows on the track only when it is this close to the intake's dates
const TODAY_REACH = 90 * DAY
// Room (percent of the track) left free at each end of the bar
const TRACK_PAD = 2
// Vertical layout (px): the bar runs from 40 to 52; a results circle's bottom;
// where the today line starts (just above the bar); each label row's top
const RESULTS_DOT_BOTTOM = 50
const TODAY_LINE_TOP = 34
const ROW_TOPS = [62, 96]
// Labels are placed by an estimate of their width: the track is about this wide
// in the page column on desktop (its min-width is 30rem), and an xs semibold
// character about this wide. Slots are wide enough that this rarely matters; a
// label that would still run into its neighbour moves to the second row.
const TRACK_PX = 720
const CHAR_PX = 6.2
const LABEL_GAP = 0.8
const labelWidth = (text: string) =>
  ((text.length * CHAR_PX + 8) / TRACK_PX) * 100

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

// One step of the track, in date order: a round's application period, its
// results date, or today
type Step =
  | { kind: 'round'; at: number; round: AdmissionRoundView }
  | { kind: 'results'; at: number; round: AdmissionRoundView }
  | { kind: 'today'; at: number }
const KIND_ORDER = { round: 0, results: 1, today: 2 }

/**
 * Not to scale: every step gets an equal slot, in date order, so labels never
 * crowd each other and nothing overflows. Back-to-back rounds (Nova SBE's)
 * still touch, and a results date or today sits between rounds as a gap. When
 * a round is open, today is a line inside its segment instead of a step.
 */
function HorizontalTrack({
  rounds,
  today
}: {
  rounds: AdmissionRoundView[]
  today: string
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()

  const steps: Step[] = []
  for (const round of rounds) {
    const start = round.opensOn ?? round.closesOn
    if (start) steps.push({ kind: 'round', at: toMs(start), round })
    if (round.resultsOn) {
      steps.push({ kind: 'results', at: toMs(round.resultsOn), round })
    }
  }
  if (steps.length === 0) return null
  const now = toMs(today)
  const dates = steps.map((step) => step.at)
  const nearToday =
    now >= Math.min(...dates) - TODAY_REACH &&
    now <= Math.max(...dates) + TODAY_REACH
  const openRound = rounds.find((r) => r.status === 'open')
  if (nearToday && !openRound) steps.push({ kind: 'today', at: now })
  steps.sort((a, b) => a.at - b.at || KIND_ORDER[a.kind] - KIND_ORDER[b.kind])

  const slot = (100 - 2 * TRACK_PAD) / steps.length
  const slotStart = (i: number) => TRACK_PAD + i * slot
  const slotCenter = (i: number) => slotStart(i) + slot / 2

  // Today inside the open round's segment, in proportion to how far it's gone
  let todayPos: number | null = null
  steps.forEach((step, i) => {
    if (step.kind === 'today') todayPos = slotCenter(i)
    if (step.kind === 'round' && step.round === openRound) {
      const { opensOn, closesOn } = step.round
      const share =
        opensOn && closesOn && toMs(closesOn) > toMs(opensOn)
          ? (now - toMs(opensOn)) / (toMs(closesOn) - toMs(opensOn))
          : 0.5
      todayPos = slotStart(i) + slot * Math.min(Math.max(share, 0.1), 0.9)
    }
  })

  // Below the track, one label per step (today's too); placed left to right,
  // a label that would run into the one before it drops to a second row
  const candidates = steps.map((step, i) => {
    if (step.kind === 'round') {
      return {
        key: `range-${i}`,
        kind: step.kind,
        pos: slotCenter(i),
        text: formatIsoShortRange(
          step.round.opensOn,
          step.round.closesOn,
          lang,
          {
            until: (date) =>
              t('degree_subpages.admission.apply.until', { date }),
            from: (date) => t('degree_subpages.admission.apply.from', { date })
          }
        ),
        sub: null
      }
    }
    if (step.kind === 'results') {
      return {
        key: `results-${i}`,
        kind: step.kind,
        pos: slotCenter(i),
        text: formatIsoShortDay(step.round.resultsOn!, lang),
        sub: t('degree_subpages.admission.apply.results')
      }
    }
    return {
      key: 'today',
      kind: step.kind,
      pos: slotCenter(i),
      text: formatIsoShortDay(today, lang),
      sub: t('degree_subpages.admission.apply.today').toLowerCase()
    }
  })
  if (todayPos !== null && openRound) {
    candidates.push({
      key: 'today',
      kind: 'today',
      pos: todayPos,
      text: formatIsoShortDay(today, lang),
      sub: t('degree_subpages.admission.apply.today').toLowerCase()
    })
  }
  const rowEnds = [-Infinity, -Infinity]
  const labels = candidates
    .sort((a, b) => a.pos - b.pos)
    .map((label) => {
      const half = labelWidth(label.text) / 2
      const free = rowEnds.findIndex(
        (end) => label.pos - half >= end + LABEL_GAP
      )
      const row = free === -1 ? 1 : free
      rowEnds[row] = label.pos + half
      return { ...label, row }
    })
  const twoRows = labels.some((label) => label.row === 1)
  const todayRow = labels.find((label) => label.kind === 'today')?.row ?? 0

  return (
    <div className="hidden overflow-x-auto sm:block" aria-hidden="true">
      <div
        className={cn(
          'relative mx-1 min-w-[30rem]',
          twoRows ? 'h-[134px]' : 'h-[100px]'
        )}
      >
        <div className="absolute inset-x-0 top-10 h-3 rounded-full bg-muted" />
        {steps.map((step, i) => {
          if (step.kind === 'round') {
            const closed = step.round.status === 'closed'
            return (
              <div key={i}>
                <div
                  className={cn(
                    'absolute top-10 h-3 rounded-[3px] border-l-2 border-background',
                    closed ? 'bg-muted-foreground/30' : 'bg-brand-solid'
                  )}
                  style={{ left: `${slotStart(i)}%`, width: `${slot}%` }}
                />
                <span
                  className={cn(
                    'absolute top-4 -translate-x-1/2 whitespace-nowrap text-xs',
                    closed
                      ? 'font-medium text-muted-foreground'
                      : 'font-semibold text-foreground'
                  )}
                  style={{ left: `${slotCenter(i)}%` }}
                >
                  {step.round.label}
                </span>
              </div>
            )
          }
          if (step.kind === 'results') {
            return (
              <span
                key={i}
                className="absolute top-[42px] size-2 -translate-x-1/2 rounded-full border-2 border-muted-foreground bg-background"
                style={{ left: `${slotCenter(i)}%` }}
              />
            )
          }
          return null
        })}
        {labels.map((label) =>
          // A results date hangs from its circle by a dotted line
          label.kind === 'results' ? (
            <span
              key={`${label.key}-line`}
              className="absolute w-0 -translate-x-1/2 border-l-2 border-dotted border-muted-foreground/60"
              style={{
                left: `${label.pos}%`,
                top: RESULTS_DOT_BOTTOM,
                height: ROW_TOPS[label.row] - RESULTS_DOT_BOTTOM - 1
              }}
            />
          ) : null
        )}
        {labels.map((label) => {
          const isToday = label.kind === 'today'
          return (
            <span
              key={label.key}
              className={cn(
                'absolute -translate-x-1/2 whitespace-nowrap text-center text-[11px] leading-tight',
                isToday ? 'text-today' : 'text-muted-foreground'
              )}
              style={{ left: `${label.pos}%`, top: ROW_TOPS[label.row] }}
            >
              <b
                className={cn(
                  'block text-xs',
                  isToday ? 'font-bold' : 'font-semibold text-foreground'
                )}
              >
                {label.text}
              </b>
              {label.sub}
            </span>
          )
        })}
        {todayPos !== null && (
          <div
            className="absolute w-0.5 -translate-x-1/2 bg-today"
            style={{
              left: `${todayPos}%`,
              top: TODAY_LINE_TOP,
              height: ROW_TOPS[todayRow] - TODAY_LINE_TOP - 5
            }}
          />
        )}
      </div>
    </div>
  )
}

function VerticalList({
  rounds,
  today
}: {
  rounds: AdmissionRoundView[]
  today: string
}) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  // Today goes before the first round that hasn't closed
  const todayAt = rounds.findIndex((r) => r.status !== 'closed')
  const nextAt = rounds.findIndex(
    (r) => r.status === 'open' || r.status === 'upcoming'
  )
  const items: ('today' | AdmissionRoundView)[] = [...rounds]
  items.splice(todayAt === -1 ? items.length : todayAt, 0, 'today')

  return (
    <ol className="sm:sr-only">
      {items.map((item, i) => {
        const last = i === items.length - 1
        if (item === 'today') {
          return (
            <li key="today" className="relative pb-3.5 pl-7">
              {!last && <Rail />}
              <span className="absolute left-0.5 top-1.5 size-2.5 rounded-full bg-today" />
              <span className="text-xs font-bold uppercase tracking-wide text-today">
                {t('degree_subpages.admission.apply.today_on', {
                  date: formatIsoShortDay(today, lang)
                })}
              </span>
            </li>
          )
        }
        const closed = item.status === 'closed'
        const isNext = rounds.indexOf(item) === nextAt
        return (
          <li
            key={item.label}
            className="relative grid grid-cols-1 gap-x-3 pb-4 pl-7 min-[400px]:grid-cols-[minmax(0,1fr)_auto]"
          >
            {!last && <Rail />}
            <span
              className={cn(
                'absolute left-0 top-1 size-3.5 rounded-full border-2',
                closed
                  ? 'border-muted-foreground/30 bg-muted-foreground/30'
                  : isNext
                    ? 'border-brand-solid bg-brand-solid'
                    : 'border-brand-solid bg-background'
              )}
            />
            <span
              className={cn(
                closed
                  ? 'font-medium text-muted-foreground'
                  : 'font-semibold text-foreground'
              )}
            >
              {item.label}
              {item.status === 'open' && (
                <span className="ml-1.5 rounded bg-tint-green px-1.5 py-0.5 align-[1px] text-[11px] font-semibold text-tint-green-fg">
                  {t('degree_subpages.admission.apply.round_open')}
                </span>
              )}
              {item.status === 'upcoming' && isNext && (
                <span className="ml-1.5 rounded bg-tint-blue px-1.5 py-0.5 align-[1px] text-[11px] font-semibold text-tint-blue-fg">
                  {t('degree_subpages.admission.apply.round_next')}
                </span>
              )}
              {closed && (
                <span className="sr-only">
                  {' '}
                  ({t('degree_subpages.admission.apply.round_closed')})
                </span>
              )}
            </span>
            <span
              className={cn(
                'tabular-nums min-[400px]:text-right',
                closed && 'text-muted-foreground'
              )}
            >
              {formatIsoPeriod(item.opensOn, item.closesOn, lang, {
                until: (date) =>
                  t('degree_subpages.admission.apply.until', { date }),
                from: (date) =>
                  t('degree_subpages.admission.apply.from', { date })
              })}
            </span>
            {item.resultsOn && (
              <span className="col-span-full text-xs text-muted-foreground">
                {t('degree_subpages.admission.apply.results_on', {
                  date: formatIsoShortDate(item.resultsOn, lang)
                })}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Rail() {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-0 left-1.5 top-4 w-0.5 bg-border"
    />
  )
}
