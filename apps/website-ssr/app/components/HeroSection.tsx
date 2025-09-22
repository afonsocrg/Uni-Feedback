import type { Degree, Faculty } from '@uni-feedback/db/schema'
import { Breadcrumb } from '.'
import { ActionButton } from './ActionButton'

interface HeroSectionProps {
  degree?: Degree
  faculty?: Faculty
  showBreadcrumb?: boolean
  title?: string
  subtitle?: string
}

export function HeroSection({
  degree,
  faculty,
  showBreadcrumb = false
}: HeroSectionProps) {
  return (
    <div className="bg-blue-50 py-6 md:py-12 px-2 md:px-4 shadow-sm">
      <div className="container mx-auto">
        {showBreadcrumb && (
          <div className="mb-6">
            <Breadcrumb {...{ faculty, degree }} />
          </div>
        )}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold text-primaryBlue mb-2 md:mb-4">
            Find the best {degree?.acronym ?? faculty?.shortName ?? 'Uni'}{' '}
            courses
          </h1>
          <p className="text-base md:text-lg text-gray-500 mb-4 md:mb-8 max-w-md md:max-w-2xl">
            Honest, anonymous student reviews to help you choose the right
            courses.
          </p>
          <div className="flex flex-row gap-2 md:gap-8 mb-2 items-center justify-center w-full md:w-auto">
            <ActionButton
              label="Browse Courses"
              description="See what students really think about each course."
              onClick={() => {
                const el = document.getElementById('course-list')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
              variant="primary"
            />
            <ActionButton
              label="Give feedback"
              description="Help your peers by sharing your honest review!"
              href="/feedback/new"
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
