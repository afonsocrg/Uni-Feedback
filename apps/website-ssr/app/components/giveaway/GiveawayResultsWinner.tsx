import type { GiveawayPhase } from '@uni-feedback/utils'
import { Loader2, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface GiveawayResultsWinnerProps {
  /** Resolved on the server, like the hero's. */
  phase: GiveawayPhase
}

/**
 * Placeholder for the prize announcement, held until the winners are drawn.
 *
 * It ships BEFORE there is anything to announce on purpose. This page is what
 * gets shared, so it is where people will come looking on 1 August; without
 * this block they arrive, find only review counts, and have no way to know
 * whether the draw has happened or where it will be posted. Saying "not yet,
 * and here is when" is the whole job.
 *
 * Two copy states, flipping automatically on the phase the rest of the page
 * uses: a promise while the campaign runs, and "being drawn" for the day or two
 * between the close and the announcement. Neither needs a deploy to switch over.
 *
 * The spinner is the point of the second state. The copy alone reads as a status
 * that could have been written weeks ago; a moving indicator is what says the
 * draw is happening now and this page is worth coming back to. It is decorative,
 * so it is hidden from screen readers, and it respects reduced motion.
 *
 * TO ANNOUNCE THE WINNERS: replace the body below with the names and drop the
 * placeholder copy keys. `announced` deliberately keeps the trophy rather than
 * the spinner, so the icon is already right when you fill this in.
 * `GiveawayRecapWinner` is the shape the February edition used (photo, name,
 * school) if you want to match it.
 */
export function GiveawayResultsWinner({ phase }: GiveawayResultsWinnerProps) {
  const { t } = useTranslation('legal')
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
