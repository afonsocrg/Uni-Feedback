import { database } from '@uni-feedback/db'
import { useTranslation } from 'react-i18next'
import { getAssetUrl } from '~/utils'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/supporters'

export async function loader() {
  const db = database()

  const allSupporters = await db.query.studentClubs.findMany({
    where: (clubs, { eq }) => eq(clubs.isActive, true),
    orderBy: (clubs) => [clubs.name]
  })

  // Sort so unions appear first, then clubs (both alphabetically)
  const sortedSupporters = allSupporters.sort((a, b) => {
    if (a.type === b.type) return 0
    return a.type === 'union' ? -1 : 1
  })

  return { supporters: sortedSupporters }
}

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('supporters.meta_title'),
    description: t('supporters.meta_desc')
  })
}

export default function SupportersPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('legal')
  const { supporters } = loaderData

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            {t('supporters.section_title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('supporters.thanks')}
          </p>
        </div>

        {/* Supporter Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {supporters.map((supporter) => (
            <a
              key={supporter.id}
              href={supporter.website ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              {supporter.logo ? (
                <img
                  src={getAssetUrl(supporter.logo)}
                  alt={`${supporter.name} logo`}
                  className="h-20 w-20 object-contain rounded-lg border border-border transition-all group-hover:scale-105"
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-lg flex items-center justify-center text-muted-foreground transition-all group-hover:scale-105 bg-muted`}
                >
                  {supporter.shortName}
                </div>
              )}
              <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                {supporter.shortName}
              </span>
            </a>
          ))}
        </div>

        {/* Support CTA */}
        <div className="text-center mt-16 pt-12 text-sm">
          <p className="text-muted-foreground">
            <a
              href="mailto:afonso@uni-feedback.com"
              className="text-primary hover:underline font-medium"
            >
              {t('supporters.join_cta')}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
