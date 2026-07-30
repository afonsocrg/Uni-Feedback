import { Button } from '@uni-feedback/ui'
import { PenSquare } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getLocalePath, getReviewPath } from '~/utils/i18n-routes'

interface GiveawayResultsCTAProps {
  /** Resolved on the server, like the hero's. */
  giveawayActive: boolean
  /** When the numbers above were read, ISO. Rendered as the freshness line. */
  generatedAt: string
}

/**
 * Closing band. While the campaign runs it asks for the one action that moves
 * the board; after it closes the ask goes away and the page ends on what the
 * reviews are for.
 *
 * The "updated at" line sits here rather than under the hero because it is a
 * footnote, but it is not optional: a page of live counts with no timestamp is
 * unreadable the moment someone screenshots it.
 */
export function GiveawayResultsCTA({
  giveawayActive,
  generatedAt
}: GiveawayResultsCTAProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()

  const updatedAtLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'pt' ? 'pt-PT' : 'en-US', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Lisbon'
      }).format(new Date(generatedAt)),
    [lang, generatedAt]
  )

  return (
    <>
      <section className="mt-4 bg-brand-emphasis py-14 text-brand-emphasis-foreground md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {t(
                giveawayActive
                  ? 'giveaway_results.cta_title'
                  : 'giveaway_results.cta_title_ended'
              )}
            </h2>
            <p className="text-brand-emphasis-foreground/90">
              {t(
                giveawayActive
                  ? 'giveaway_results.cta_subtitle'
                  : 'giveaway_results.cta_subtitle_ended'
              )}
            </p>
            <div className="flex justify-center pt-2">
              <Button size="lg" variant="secondary" asChild>
                <a
                  href={`${getReviewPath(lang)}?from=giveaway_results`}
                  onClick={() => {
                    analytics.navigation.feedbackFormLinkClicked({
                      source: 'giveaway_results_cta',
                      referrerPage: getPageName(window.location.pathname)
                    })
                  }}
                >
                  <PenSquare className="size-5" />
                  {t('giveaway_results.cta_button')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-8">
        <div className="container mx-auto px-4">
          <p className="mx-auto max-w-4xl text-sm text-muted-foreground">
            {t('giveaway_results.updated_at', { date: updatedAtLabel })}{' '}
            <Link
              to={getLocalePath('giveaway-rules', lang)}
              className="underline hover:text-foreground"
            >
              {t('giveaway_results.rules_link')}
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}
