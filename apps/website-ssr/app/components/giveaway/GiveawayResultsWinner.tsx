import type { GiveawayPhase } from '@uni-feedback/utils'
import { Loader2, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GiveawayWinners } from './GiveawayWinners'

interface GiveawayResultsWinnerProps {
  /** Resolved on the server, like the hero's. */
  phase: GiveawayPhase
}

/**
 * The prize announcement, and the placeholder that stands in until the draw.
 *
 * It shipped BEFORE there was anything to announce on purpose. This page is what
 * gets shared, so it is where people come looking on 1 August; without this block
 * they arrive, find only review counts, and have no way to know whether the draw
 * has happened. Saying "not yet, and here is when" was the whole job.
 *
 * Three copy states, flipping on the phase the rest of the page uses: a promise
 * while the campaign runs, "being drawn" for the day or two between the close and
 * the announcement, and the winners once `GIVEAWAY_WINNERS_ANNOUNCED` is on.
 *
 * The winners themselves come from `GiveawayWinners`, shared with the campaign
 * page, so the three of them are written down once. This component owns only the
 * heading and the two pre-announcement states.
 *
 * The spinner is the point of the drawing state. The copy alone reads as a status
 * that could have been written weeks ago; a moving indicator is what says the
 * draw is happening now and this page is worth coming back to. It is decorative,
 * so it is hidden from screen readers, and it respects reduced motion.
 */
export function GiveawayResultsWinner({ phase }: GiveawayResultsWinnerProps) {
  const { t } = useTranslation('legal')

  if (phase === 'announced') {
    return (
      <section className="bg-background py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <div className="mx-auto w-fit rounded-full bg-brand/10 p-2.5">
                <Trophy className="size-5 text-primaryBlue" />
              </div>
              <h2 className="mt-3 font-heading text-lg font-semibold tracking-tight md:text-xl">
                {t('giveaway_results.winner_title_announced')}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {t('giveaway_results.winner_desc_announced')}
              </p>
            </div>

            <GiveawayWinners />
          </div>
        </div>
      </section>
    )
  }

  const drawing = phase === 'drawing'

  return (
    <section className="bg-background py-6">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-4xl items-start gap-4 rounded-xl border border-border bg-muted/40 p-5 md:p-6">
          <div className="shrink-0 rounded-full bg-brand/10 p-2.5">
            {drawing ? (
              <Loader2
                aria-hidden="true"
                className="size-5 text-primaryBlue motion-safe:animate-spin"
              />
            ) : (
              <Trophy className="size-5 text-primaryBlue" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
              {t(
                phase === 'active'
                  ? 'giveaway_results.winner_title_pending'
                  : 'giveaway_results.winner_title_drawing'
              )}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t(
                phase === 'active'
                  ? 'giveaway_results.winner_desc_pending'
                  : 'giveaway_results.winner_desc_drawing'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
