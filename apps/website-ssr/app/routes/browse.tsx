import { database } from '@uni-feedback/db'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { useEffect } from 'react'
import { BrowsePageLayout, FacultySelector } from '~/components'
import { userPreferences } from '~/utils'
import { SITE_URL } from '~/utils/constants'

import type { Route } from './+types/browse'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

export function meta({ loaderData }: Route.MetaArgs) {
  const title = 'Browse Universities - Uni Feedback'

  // Build description with available faculties
  const facultyNames = loaderData?.faculties
    ?.map((f) => f.shortName || f.name)
    .slice(0, 5) // First 5 faculties
    .join(', ')

  let description =
    'Choose your university to explore degrees and courses with honest, anonymous student reviews.'

  if (facultyNames) {
    description += ` Available universities: ${facultyNames}${loaderData.faculties.length > 5 ? ', and more' : ''}.`
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
            url: `${SITE_URL}/${faculty.slug}`
          }
        }))
      }
    : null

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },

    // Keywords for SEO
    {
      name: 'keywords',
      content: [
        'university reviews',
        'portuguese universities',
        'student feedback',
        'course reviews',
        'university comparison',
        ...(loaderData?.faculties?.map((f) => f.name) || [])
      ].join(', ')
    },

    // Schema.org structured data
    ...(structuredData ? [{ 'script:ld+json': structuredData }] : [])
  ]
}

export async function loader() {
  const db = database()

  const faculties = await db.query.faculties.findMany({
    orderBy: (faculties) => [faculties.id]
  })

  return { faculties }
}

export default function BrowsePage({ loaderData }: Route.ComponentProps) {
  // Persist selection when component mounts
  useEffect(() => {
    userPreferences.set({
      lastVisitedPath: '/browse'
    })
  }, [])

  return (
    <BrowsePageLayout
      title="Select Your University"
      actions={
        <WarningAlert
          message={
            <>
              Don't see your university?{' '}
              <Button
                variant="link"
                size="xs"
                asChild
                className="p-0 h-auto text-sm underline"
              >
                <a
                  href={ADD_COURSE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Request it here
                </a>
              </Button>
            </>
          }
        />
      }
    >
      <FacultySelector faculties={loaderData.faculties} />
    </BrowsePageLayout>
  )
}
