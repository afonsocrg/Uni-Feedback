import { database } from '@uni-feedback/db'
import { Button, WarningAlert } from '@uni-feedback/ui'
import { useEffect } from 'react'
import { BrowsePageLayout, FacultySelector } from '~/components'
import { userPreferences } from '~/utils'

import type { Route } from './+types/browse'

const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Browse Universities - Uni Feedback' },
    {
      name: 'description',
      content:
        'Choose your university to explore degrees and courses with honest student reviews.'
    }
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
