import type { ReactNode } from 'react'
import { SchoolLogo } from './SchoolLogo'

/**
 * The top of an overview page (university, faculty, degree): the school's
 * logo, then the parent as an eyebrow ("Faculdade · Universidade"), the name
 * as the h1, and whatever sits right under it (official links).
 */
export function PageHeading({
  school,
  eyebrow,
  title,
  children
}: {
  /** Whose logo leads the heading: the university, or the faculty */
  school?: { logo: string | null; name: string; shortName: string }
  /** The parent the page belongs to, above the name */
  eyebrow?: ReactNode
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-4">
      {school && (
        <SchoolLogo
          logo={school.logo}
          name={school.name}
          shortName={school.shortName}
          className="md:size-16 md:rounded-xl"
        />
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-sm font-medium text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
