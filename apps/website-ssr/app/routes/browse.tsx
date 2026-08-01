import { database } from '@uni-feedback/db'
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { BrowsePageContent } from '~/components'
import { userPreferences } from '~/utils'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/browse'

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'browse')

  // Build description with available faculties
  const { origin } = loaderData
  const facultyNames = loaderData?.faculties
    ?.map((f) => f.shortName || f.name)
    .slice(0, 5) // First 5 faculties
    .join(', ')

  let description = t('meta.description')

  if (facultyNames) {
    description += t('meta.universities_suffix', {
      names: facultyNames,
      more: loaderData.faculties.length > 5 ? t('meta.and_more') : ''
    })
  }

  // Schema.org ItemList for faculties
  const structuredData = loaderData?.faculties
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Portuguese Universities',
        description: 'List of Portuguese universities with student reviews',
        numberOfItems: loaderData.faculties.length,
        itemListElement: loaderData.faculties.map((faculty, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CollegeOrUniversity',
            name: faculty.name,
            url: `${origin}/${faculty.slug}`,
            // Tells search engines that IST and FDUL are both ULisboa, which
            // the faculty names alone never say.
            ...(faculty.university && {
              parentOrganization: {
                '@type': 'CollegeOrUniversity',
                name: faculty.university.name,
                alternateName: faculty.university.shortName,
                ...(faculty.university.url && { url: faculty.university.url })
              }
            })
          }
        }))
      }
    : null

  return buildMeta({
    matches,
    title: t('meta.title'),
    description,
    keywords: [
      'university reviews',
      'portuguese universities',
      'student feedback',
      'course reviews',
      'university comparison',
      ...(loaderData?.faculties?.map((f) => f.name) || [])
    ],
    structuredData: structuredData ?? undefined
  })
}

export async function loader({ request }: { request: Request }) {
  const db = database()

  const faculties = await db.query.faculties.findMany({
    orderBy: (faculties) => [faculties.id],
    // Drives the university filter chips. Nullable: a faculty with no
    // university still shows in the grid, it just answers to no chip.
    with: { university: true }
  })

  return { faculties, origin: getRequestOrigin(request) }
}

export default function BrowsePage({ loaderData }: Route.ComponentProps) {
  const location = useLocation()

  // Persist the actual visited path (lang-aware)
  useEffect(() => {
    userPreferences.set({ lastVisitedPath: location.pathname })
  }, [location.pathname])

  return <BrowsePageContent faculties={loaderData.faculties} />
}
