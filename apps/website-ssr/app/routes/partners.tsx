import { database } from '@uni-feedback/db'
import { getAssetUrl } from '~/utils'
import type { Route } from './+types/partners'

export async function loader() {
  const db = database()

  const allPartners = await db.query.studentClubs.findMany({
    where: (clubs, { eq }) => eq(clubs.isActive, true),
    orderBy: (clubs) => [clubs.name]
  })

  // Sort so unions appear first, then clubs (both alphabetically)
  const sortedPartners = allPartners.sort((a, b) => {
    if (a.type === b.type) return 0
    return a.type === 'union' ? -1 : 1
  })

  return { partners: sortedPartners }
}

export function meta() {
  return [
    { title: 'Our Partners | Uni Feedback' },
    {
      name: 'description',
      content:
        'Partner student clubs that have joined Uni Feedback to help build a better academic community'
    }
  ]
}

export default function PartnersPage({ loaderData }: Route.ComponentProps) {
  const { partners } = loaderData

  // Generate initials from short name (e.g., "AEIST" -> "AE")
  const getInitials = (shortName: string) => {
    return shortName.slice(0, 2).toUpperCase()
  }

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Our Partners</h1>
          <p className="text-sm text-muted-foreground">
            A huge thanks to everyone who joined us on this mission!
          </p>
        </div>

        {/* Partner Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {partners.map((partner) => (
            <a
              key={partner.id}
              href={partner.website ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              {partner.logo ? (
                <img
                  src={getAssetUrl(partner.logo)}
                  alt={`${partner.name} logo`}
                  className="h-20 w-20 object-contain rounded-lg border border-border transition-all group-hover:scale-105"
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-lg flex items-center justify-center text-gray-600 transition-all group-hover:scale-105 bg-gray-300`}
                >
                  {partner.shortName}
                </div>
              )}
              <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
                {partner.shortName}
              </span>
            </a>
          ))}
        </div>

        {/* Partnership CTA */}
        <div className="text-center mt-16 pt-12 border-t text-sm">
          <p className="text-muted-foreground">
            Want to partner with us?{' '}
            <a
              href="mailto:partnerships@uni-feedback.com"
              className="text-primary hover:underline font-medium"
            >
              Reach out
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
