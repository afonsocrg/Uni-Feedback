import type { Faculty } from '@uni-feedback/db'
import { getAssetUrl } from '../../utils'

interface LovedByStudentsSectionProps {
  faculties: Faculty[]
}

export function LovedByStudentsSection({
  faculties
}: LovedByStudentsSectionProps) {
  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
            Loved by Hundreds of Students at
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {faculties.map((faculty) => {
              const logoUrl = getAssetUrl(faculty.logoHorizontal)
              if (!logoUrl) return null

              return (
                <img
                  key={faculty.id}
                  alt={`${faculty.name} logo`}
                  src={logoUrl}
                  className="h-12"
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
