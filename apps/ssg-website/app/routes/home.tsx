// import { FacultySelector } from '~/components/faculty/FacultySelector'
// import { HeroSection } from '~/components/layout/HeroSection'
import { faculties } from '@uni-feedback/database'
import { Test } from '~/components'
import type { Route } from './+types/home'

export async function loader({ context }: Route.LoaderArgs) {
  const result = await context.db
    .select({
      id: faculties.id,
      name: faculties.name,
      shortName: faculties.shortName,
      url: faculties.url,
      emailSuffixes: faculties.emailSuffixes
    })
    .from(faculties)
  return {
    faculties: result
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Faculties</h1>
      <ul>
        {loaderData.faculties.map((f) => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
      <Test />
    </>
  )
}
