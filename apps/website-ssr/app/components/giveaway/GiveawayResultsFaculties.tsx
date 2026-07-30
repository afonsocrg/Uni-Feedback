import { useTranslation } from 'react-i18next'
import { useLang } from '~/hooks'
import type { ResultsFaculty } from '~/lib/giveawayResults.server'
import { formatCount } from '~/utils'

interface GiveawayResultsFacultiesProps {
  faculties: ResultsFaculty[]
}

/**
 * Faculty totals, deliberately secondary to the degree list: one faculty has
 * several times the reviews of any other, so bars here would render every other
 * faculty as a stub. It stays on the page because it is the honest picture of
 * where the reviews came from, but as a plain strip of counts, with no bars and
 * no emphasis on the largest, so it reads as a map of who took part.
 *
 * Review counts only. Contributor counts are not published here at all: shown
 * for the large faculties and withheld for the small ones, the gap was itself
 * the disclosure, since a missing count means "fewer than three people" and sat
 * next to a review total those people would then own.
 */
export function GiveawayResultsFaculties({
  faculties
}: GiveawayResultsFacultiesProps) {
  const { t } = useTranslation('legal')
  const lang = useLang()

  if (faculties.length === 0) return null

  return (
    <section className="bg-background py-10">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
            {t('giveaway_results.faculties_title')}
          </h2>
          <p className="mt-1 mb-5 max-w-2xl text-muted-foreground">
            {t('giveaway_results.faculties_desc')}
          </p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {faculties.map((faculty) => (
              <div
                key={faculty.facultyId}
                className="border-t border-border py-4 pr-6"
              >
                <dt className="text-sm font-semibold">{faculty.shortName}</dt>
                <dd className="font-heading text-xl font-bold tabular-nums">
                  {formatCount(faculty.reviews, lang)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
