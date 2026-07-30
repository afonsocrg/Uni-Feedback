import { Button } from '@uni-feedback/ui'
import { CalendarClock, PenSquare } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GenericBreadcrumb } from '~/components/common'
import { useLang } from '~/hooks'
import type { GiveawayResults } from '~/lib/giveawayResults.server'
import { formatCount } from '~/utils'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'

interface GiveawayResultsHeroProps {
  totals: GiveawayResults['totals']
  windowStart: string
  windowEnd: string
  /** Resolved on the server so the copy never flips between SSR and hydration. */
  giveawayActive: boolean
}

/**
 * Opening block of the public results page: what the campaign produced, in one
 * sentence, plus the only action the page asks for.
 *
 * The copy has two states. While the giveaway runs this is a live snapshot and
 * the deadline is the urgency; once it closes the same page becomes the recap
 * we promised, so nothing here has to be taken down or rewritten on 1 August.
 *
 * The breadcrumb is the only way back to the campaign page: this link is shared
 * on its own into WhatsApp groups and stories, so a large share of visitors
 * land here having never seen /giveaway and would otherwise have nowhere to go
 * to find out what the giveaway actually is.
 */
export function GiveawayResultsHero({
  totals,
  windowStart,
  windowEnd,
  giveawayActive
}: GiveawayResultsHeroProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()

  const { rangeLabel, endLabel } = useMemo(() => {
    const locale = lang === 'pt' ? 'pt-PT' : 'en-US'
    const short = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'Europe/Lisbon'
    })
    const long = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Lisbon'
    })
    // The window's END is exclusive (00:00 on 1 Aug), so the last day students
    // can act on is one millisecond earlier. Always display that one.
    const lastDay = new Date(new Date(windowEnd).getTime() - 1)
    return {
      rangeLabel: `${short.format(new Date(windowStart))} – ${short.format(lastDay)}`,
      endLabel: long.format(lastDay)
    }
  }, [lang, windowStart, windowEnd])

  return (
    <section className="bg-background pt-12 pb-6 md:pt-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <GenericBreadcrumb
            className="-mt-2"
            items={[
              {
                label: t('giveaway_results.breadcrumb_giveaway'),
                href: getLocalePath('giveaway', lang),
                onClick: () =>
                  analytics.giveaway.resultsBreadcrumbClicked({
                    referrerPage: getPageName(window.location.pathname)
                  })
              },
              {
                label: t('giveaway_results.breadcrumb_current'),
                isActive: true
              }
            ]}
          />

          <p className="text-sm font-semibold uppercase tracking-wide text-primaryBlue">
            {t('giveaway_page.edition_name')} · {rangeLabel}
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl">
            {t('giveaway_results.title')}
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            {t(
              giveawayActive
                ? 'giveaway_results.lede'
                : 'giveaway_results.lede_ended',
              {
                reviews: formatCount(totals.reviews, lang),
                contributors: formatCount(totals.contributors, lang)
              }
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="lg" asChild>
              <a
                href={`${getReviewPath(lang)}?from=giveaway_results`}
                onClick={() => {
                  analytics.navigation.feedbackFormLinkClicked({
                    source: 'giveaway_results_hero',
                    referrerPage: getPageName(window.location.pathname)
                  })
                }}
              >
                <PenSquare className="size-5" />
                {t('giveaway_results.cta_button')}
              </a>
            </Button>

            {/* Plain text, not a pill: next to the button a bordered chip reads
                as a second, disabled control. */}
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarClock className="size-4 shrink-0" />
              {t(
                giveawayActive
                  ? 'giveaway_results.deadline_active'
                  : 'giveaway_results.deadline_ended',
                { date: endLabel }
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
