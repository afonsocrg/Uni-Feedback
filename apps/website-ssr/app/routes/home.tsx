import { database } from '@uni-feedback/db'
import { FacultySelector, HeroSection } from '../components'

import type { Route } from './+types/home'

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Uni Feedback - Find the best university courses' },
    {
      name: 'description',
      content:
        'Honest, anonymous student reviews to help you choose the right courses.'
    }
  ]
}

export async function action({ request }: Route.ActionArgs) {
  // Placeholder action - can be implemented later
  return { message: 'Action not implemented yet' }
}

export async function loader({ context }: Route.LoaderArgs) {
  const db = database()

  const faculties = await db.query.faculties.findMany({
    orderBy: (faculties) => [faculties.id]
  })

  return {
    faculties,
    message: context.VALUE_FROM_EXPRESS
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <HeroSection showBreadcrumb />
      <div className="container mx-auto px-4 py-8">
        <FacultySelector faculties={loaderData.faculties} />
      </div>
    </div>
  )
}
