import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface GiveawayResultsWinnerProps {
  /** Resolved on the server, like the hero's. */
  giveawayActive: boolean
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
 * Two copy states, flipping automatically on the same `giveawayActive` the rest
 * of the page uses: a promise while the campaign runs, and "being drawn" for
 * the day or two between the close and the announcement. Neither needs a deploy
 * to switch over.
 *
 * TO ANNOUNCE THE WINNERS: replace the body below with the names and drop the
 * placeholder copy keys. `GiveawayRecapWinner` is the shape the February
 * edition used (photo, name, school) if you want to match it.
 */
export function GiveawayResultsWinner({
  giveawayActive
}: GiveawayResultsWinnerProps) {
  const { t } = useTranslation('legal')

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-4xl items-start gap-4 rounded-xl border border-border bg-muted/40 p-5 md:p-6">
          <div className="shrink-0 rounded-full bg-brand/10 p-2.5">
            <Trophy className="size-5 text-primaryBlue" />
          </div>

          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-tight md:text-xl">
              {t(
                giveawayActive
                  ? 'giveaway_results.winner_title_pending'
                  : 'giveaway_results.winner_title_drawing'
              )}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t(
                giveawayActive
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
