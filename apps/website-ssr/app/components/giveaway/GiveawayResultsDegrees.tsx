import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import type { ResultsDegree } from '~/lib/giveawayResults.server'
import { formatCount, getAssetUrl } from '~/utils'
import { analytics } from '~/utils/analytics'
import { getDegreePath } from '~/utils/i18n-routes'

interface GiveawayResultsDegreesProps {
  degrees: ResultsDegree[]
}

/**
 * Rows visible before "show all". Five is what fits on a phone without pushing
 * the faculty strip and the CTA off the bottom of the page.
 */
const COLLAPSED_ROWS = 5

/**
 * Where the reviews came from, by degree.
 *
 * Ordered by review count, but deliberately not presented as a ranking: no rank
 * numbers, no podium colour, one bar tone for every row. The order still says
 * which degrees showed up, without turning a group of students who all did the
 * same thing into winners and losers. The page exists to celebrate the total,
 * and a numbered board makes fifth place read as a failure when it is sixty
 * reviews that did not exist a month ago.
 *
 * Bars are relative to the largest row, so the list reads as one shared picture
 * rather than as per-row progress. The scale stays pinned to the top row when
 * the list expands, so rows do not resize under the reader mid-interaction.
 *
 * Expanding renders rows that were always in the payload rather than fetching:
 * the whole list is twenty rows of five short fields, which is far cheaper to
 * ship than the round trip would be, and it means the hidden rows are in the
 * HTML for anyone with JS off.
 *
 * Review counts only, and the query already dropped degrees with fewer than
 * three contributors. Both rules exist so no row can be traced back to one
 * student, and the second one matters MORE now that the list expands: the tail
 * is exactly where the smallest, most identifiable degrees would surface.
 * See `giveawayResults.server.ts`.
 */
export function GiveawayResultsDegrees({
  degrees
}: GiveawayResultsDegreesProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()
  const [expanded, setExpanded] = useState(false)

  if (degrees.length === 0) return null

  const topReviews = degrees[0].reviews
  const hasMore = degrees.length > COLLAPSED_ROWS
  const visible = expanded ? degrees : degrees.slice(0, COLLAPSED_ROWS)

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {t('giveaway_results.degrees_title')}
          </h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            {t('giveaway_results.degrees_desc')}
          </p>

          <ul className="mt-5 border-b border-border">
            {visible.map((degree, index) => {
              const href =
                degree.facultySlug && degree.slug
                  ? getDegreePath(lang, degree.facultySlug, degree.slug)
                  : null

              const logoUrl = degree.facultyLogo
                ? getAssetUrl(degree.facultyLogo)
                : null

              const row = (
                <div className="-mx-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-3 py-3.5 transition-colors group-hover:bg-muted sm:gap-x-4">
                  {/* White plate: several of these logos are dark marks on a
                      transparent background and vanish in dark mode. The column
                      keeps its width when a faculty has no logo so the degree
                      names stay aligned down the list. */}
                  <span
                    className={`row-span-2 inline-flex size-12 flex-shrink-0 items-center justify-center self-center overflow-hidden rounded-lg p-1.5 sm:size-14 ${
                      logoUrl ? 'bg-white' : 'bg-muted'
                    }`}
                  >
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                      />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="font-semibold break-words">
                      {degree.name}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {degree.facultyShortName} · {degree.acronym}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-heading text-lg font-bold tabular-nums">
                      {formatCount(degree.reviews, lang)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('giveaway_results.degrees_count_label')}
                    </div>
                  </div>

                  {/* Starts after the logo column and spans the text and count
                      columns, so every bar shares one baseline and the list
                      reads as a single picture, not per-row progress. */}
                  <div className="col-span-2 col-start-2 mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primaryBlue/70"
                      style={{
                        width: `${Math.round((degree.reviews / topReviews) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )

              return (
                <li key={degree.degreeId} className="border-t border-border">
                  {href ? (
                    <Link
                      to={href}
                      className="group block"
                      onClick={() =>
                        analytics.giveaway.resultsDegreeClicked({
                          degreeId: degree.degreeId,
                          position: index + 1
                        })
                      }
                    >
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              )
            })}
          </ul>

          {hasMore && (
            <button
              type="button"
              onClick={() => {
                const next = !expanded
                setExpanded(next)
                if (next) {
                  analytics.giveaway.resultsDegreesExpanded({
                    totalDegrees: degrees.length
                  })
                }
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primaryBlue hover:underline"
            >
              {expanded
                ? t('giveaway_results.degrees_show_fewer')
                : t('giveaway_results.degrees_show_all', {
                    count: degrees.length
                  })}
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
