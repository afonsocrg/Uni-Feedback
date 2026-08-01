import { Trans, useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'

/**
 * The three winners of the summer 2026 edition, announced by degree and faculty
 * and nothing else.
 *
 * WHY NO NAMES. The rules allow "[First name] [Last initial], [Faculty]" with the
 * winner's consent, but consent has to be chased and a name on a public page is
 * permanent. "A student from <degree> at <faculty>" says the same useful thing
 * (the prizes went to real students, spread across three faculties) while
 * identifying nobody: the smallest of the three degrees had 7 contributors in the
 * window, comfortably above the MIN_CONTRIBUTORS floor
 * `giveawayResults.server.ts` uses to decide when a group is small enough to be
 * traceable to individuals.
 *
 * The degree shown is whichever one the winner wrote the most reviews for, since
 * a student can review courses listed under several degrees.
 *
 * WHY THE DEGREE NAMES ARE TRANSLATED. Everywhere else on the site a degree name
 * comes from the database, which stores exactly one name per degree, so it is
 * shown as the faculty publishes it. These three are hardcoded rather than
 * queried, so there is no reason to make a Portuguese reader parse "Bachelor's in
 * Management".
 *
 * The faculty strings carry their own preposition ("na Nova FCT", "no IST"),
 * because Portuguese contracts it differently per faculty and one template
 * cannot supply it.
 *
 * Lives in its own component because it is rendered on both the campaign page
 * (the wrap-up) and the results page. Hardcoded winners duplicated across two
 * files is exactly the kind of thing that gets half-corrected later.
 */

// `as const` is load-bearing: t() takes literal key types, so without it these
// widen to `string` and every lookup below fails to type-check.
const AMBASSADOR = {
  degree: 'giveaway_winners.ambassador_degree',
  faculty: 'giveaway_winners.ambassador_faculty',
  logo: 'faculties/nova_fct/logo.png'
} as const

/** Both won the same prize, so this is draw order and not a ranking. */
const DRAWN = [
  {
    degree: 'giveaway_winners.drawn_1_degree',
    faculty: 'giveaway_winners.drawn_1_faculty',
    logo: 'faculties/nova_sbe/logo.png'
  },
  {
    degree: 'giveaway_winners.drawn_2_degree',
    faculty: 'giveaway_winners.drawn_2_faculty',
    logo: 'faculties/ist/logo.png'
  }
] as const

type Winner = typeof AMBASSADOR | (typeof DRAWN)[number]

/**
 * One winner: the faculty mark, then who they are.
 *
 * The logo is a placeholder for a photo. If a winner ever consents to one, it
 * drops in here at the same size and nothing else moves.
 */
function WinnerEntry({ winner }: { winner: Winner }) {
  const { t } = useTranslation('legal')

  return (
    <div className="flex flex-col items-center text-center">
      {/* White plate: several of these marks are dark on a transparent
          background and vanish in dark mode. Same treatment as the degree
          leaderboard's rows. */}
      <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-2.5 ring-1 ring-border">
        <img
          src={getAssetUrl(winner.logo)}
          alt=""
          loading="lazy"
          className="size-full object-contain"
        />
      </span>

      <p className="mt-3 max-w-xs text-balance text-foreground">
        {t('giveaway_winners.student_at', {
          degree: t(winner.degree),
          faculty: t(winner.faculty)
        })}
      </p>
    </div>
  )
}

export function GiveawayWinners() {
  const { t } = useTranslation('legal')

  return (
    <div className="mx-auto max-w-4xl">
      {/* No cards, no borders. Two prizes, each introduced by its own heading
          and separated by whitespace: boxing three people into three panels made
          them read as a comparison table rather than as an announcement. */}
      {/* The drumroll. The hero already says winners exist; this is the line that
          hands over to the names, so the two prize headings below it are stepped
          down a level and lightened to keep one thing shouting per screen. */}
      <h2 className="text-center font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
        {t('giveaway_winners.title')}
      </h2>

      {/* `contents` keeps each prize a real <section> while letting its heading
          and its winners participate in the outer grid directly. That is what
          puts both headings in one shared row and both winner blocks in the
          next, so the two columns stay aligned even though the draw
          description wraps to two lines and the Ambassador's does not. Aligning
          by eye with a min-height would break the moment a translation grew. */}
      <div className="mt-12 grid gap-x-10 gap-y-7 md:grid-cols-2">
        <section className="contents">
          <div className="text-center md:col-start-1 md:row-start-1">
            <h3 className="font-heading text-lg font-medium tracking-tight md:text-xl">
              {t('giveaway_winners.ambassador_title')}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t('giveaway_winners.ambassador_desc')}
            </p>
          </div>

          <div className="md:col-start-1 md:row-start-2">
            <WinnerEntry winner={AMBASSADOR} />
          </div>
        </section>

        <section className="contents">
          {/* The extra top margin only exists while the two prizes are stacked;
              side by side they share the heading row and need no separation. */}
          <div className="mt-9 text-center md:col-start-2 md:row-start-1 md:mt-0">
            <h3 className="font-heading text-lg font-medium tracking-tight md:text-xl">
              {t('giveaway_winners.drawn_title')}
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              {t('giveaway_winners.drawn_desc')}
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 sm:gap-6 md:col-start-2 md:row-start-2">
            {DRAWN.map((winner) => (
              <WinnerEntry key={winner.degree} winner={winner} />
            ))}
          </div>
        </section>
      </div>

      {/* Kept to two short sentences. The spam mention has to be here (that mail
          went to a few hundred people at once, so a slice of it lands in spam
          and those students conclude they were skipped), but this is the least
          interesting thing on the page and it should not read like the most.

          No note explaining why winners are shown by degree rather than by name:
          nobody arrives wondering, and answering an unasked question about
          privacy is what makes a reader start asking it. */}
      <p className="mx-auto mt-16 max-w-2xl text-center text-sm text-muted-foreground">
        <Trans
          i18nKey="giveaway_winners.email_note"
          ns="legal"
          components={[
            <a
              href="mailto:afonso@uni-feedback.com"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            />
          ]}
        />
      </p>
    </div>
  )
}
