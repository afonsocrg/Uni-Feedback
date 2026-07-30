import { useCountUp, useLang } from '~/hooks'
import { formatCount } from '~/utils'

export interface ResultsNumber {
  value: number
  label: string
}

interface GiveawayResultsNumbersProps {
  items: ResultsNumber[]
  /**
   * Headline size. The page shows two of these strips and they are not peers:
   * the first one is what we achieved and carries the page, the second is the
   * spread behind the leaderboard and must not compete with it.
   */
  emphasis?: boolean
}

/**
 * A strip of counting numbers, read as one line rather than as cards.
 *
 * Separation is a single hairline per cell and nothing else: no frame, no card
 * background, no vertical rules. Horizontal rules alone survive every column
 * count, so the strip does not need per-breakpoint corrections and cannot leave
 * a stray divider next to a ragged last row.
 *
 * Every number in a strip counts up off ONE ramp (see `useCountUp`), so they
 * land together and the strip reads as a single reveal. Each strip owns its own
 * ramp, which is what makes the second one animate when it is scrolled to
 * rather than having finished offscreen.
 *
 * `tabular-nums` is load-bearing here and not just polish: without it every
 * frame re-measures and the labels jitter sideways for the whole animation.
 */
export function GiveawayResultsNumbers({
  items,
  emphasis = false
}: GiveawayResultsNumbersProps) {
  const lang = useLang()
  const { ref, progress } = useCountUp<HTMLDListElement>()

  return (
    <dl ref={ref} className="grid grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="border-t border-border py-4 pr-2 sm:pr-4"
        >
          {/* aria-label carries the final value throughout: a screen reader
              announcing every intermediate number would be unusable. */}
          {/* The phone step down is not cosmetic. Three columns on a 375px
              screen leave ~106px per number, and the word count is the widest
              thing on the page: seven characters, which overflow the column
              at anything above text-2xl. It only ever grows. */}
          <dd
            className={`font-heading font-bold tabular-nums tracking-tight ${
              emphasis
                ? 'text-2xl sm:text-4xl md:text-5xl'
                : 'text-xl sm:text-2xl md:text-3xl'
            }`}
            aria-label={formatCount(item.value, lang)}
          >
            <span aria-hidden="true">
              {formatCount(Math.round(item.value * progress), lang)}
            </span>
          </dd>
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  )
}
