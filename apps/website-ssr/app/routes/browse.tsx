import { database } from '@uni-feedback/db'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import {
  BrowsePageLayout,
  FacultySelector,
  MissingItemNote
} from '~/components'
import { userPreferences } from '~/utils'
import { buildMeta, metaT } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/browse'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

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
            url: `${origin}/${faculty.slug}`
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
    orderBy: (faculties) => [faculties.id]
  })

  return { faculties, origin: getRequestOrigin(request) }
}

export default function BrowsePage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation('browse')
  const location = useLocation()

  // Persist the actual visited path (lang-aware)
  useEffect(() => {
    userPreferences.set({ lastVisitedPath: location.pathname })
  }, [location.pathname])

  return (
    <BrowsePageLayout
      title={t('page.title')}
      actions={
        // No `text`: this page's link copy is a whole sentence on its own.
        <MissingItemNote
          linkLabel={t('page.request_link')}
          href={ADD_COURSE_FORM_URL}
        />
      }
    >
      <FacultySelector faculties={loaderData.faculties} />
    </BrowsePageLayout>
  )
}
