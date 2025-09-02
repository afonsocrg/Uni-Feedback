import type { Faculty } from '@uni-feedback/database'
import { faculties } from '@uni-feedback/database'
import type { Route } from './+types/home'
// import { FacultySelector } from '~/components/faculty/FacultySelector'
// import { HeroSection } from '~/components/HeroSection'

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
    faculties: result as Faculty[]
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { faculties } = loaderData

  return (
    <>
      <h1>Hello, world!</h1>
      <ul>
        {faculties.map((f) => (
          <li key={f.id}>{f.name}</li>
        ))}
      </ul>
    </>
    // <div>
    //   {/* <HeroSection showBreadcrumb /> */}
    //   Hero
    //   <div className="container mx-auto px-4 py-8">
    //     {/* <FacultySelector faculties={faculties} /> */}
    //     Selector
    //   </div>
    //   <Test />
    // </div>
  )
}
