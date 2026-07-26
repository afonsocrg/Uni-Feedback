import { useLang } from '~/hooks'
import { getCoursePath } from '~/utils/i18n-routes'
import { CourseCard } from './CourseCard'
import type { CourseListingProps } from './types'

export function CourseCardGrid({ sections }: CourseListingProps) {
  const lang = useLang()

  // Flat rank across sections, so `positionInList` reads as position down the
  // whole listing the student sees, not a per-section index.
  let position = 0

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.key}>
          {section.heading && (
            <h2 className="text-lg font-semibold text-foreground mb-4">
              {section.heading}
            </h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.entries.map(({ course, terms }) => (
              <CourseCard
                key={`${section.key}-${course.id}`}
                courseId={course.id}
                acronym={course.acronym}
                name={course.name}
                terms={terms}
                averageRating={course.averageRating}
                averageWorkload={course.averageWorkload}
                totalFeedbackCount={course.totalFeedbackCount}
                hasMandatoryExam={course.hasMandatoryExam}
                isMandatory={course.isMandatory}
                href={getCoursePath(lang, course.id)}
                positionInList={position++}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
