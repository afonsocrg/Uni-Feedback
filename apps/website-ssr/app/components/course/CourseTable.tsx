import {
  Button,
  Chip,
  StarRating,
  WorkloadRatingDisplay
} from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useLang } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath, getCoursePath } from '~/utils/i18n-routes'
import { ListingRow } from '../common/ListingRow'
import { RowTag } from '../common/RowTag'
import type { CourseListingEntry, CourseListingProps } from './types'

// Fixed widths from `md` up are what keep the rating and workload cells lined up
// down the listing: they fix the width of the row's right-hand group, so the
// title truncates at the same point on every row and the cells start at the same
// x. Let either hug its content and a long workload label shifts its whole row.
const COLUMN = {
  rating: 'md:w-40',
  workload: 'md:w-28'
}

function CourseRow({ course, terms }: CourseListingEntry) {
  const { t } = useTranslation('browse')
  const lang = useLang()
  const navigate = useNavigate()

  const rating = Number(course.averageRating || 0)
  const workload = Number(course.averageWorkload || 0)
  const hasFeedback = course.totalFeedbackCount > 0

  return (
    <ListingRow
      href={getCoursePath(lang, course.id)}
      title={course.name}
      /* Tags flag only the exception (a term narrower than the section's, a
         known elective, a required exam); the nullable defaults earn no tag.

         The term rides right after the acronym, and is the one tag that carries
         colour: within a section the terms are what split the courses into
         groups, and a colour makes that split scannable down the listing in a
         way a row of identical grey tags could not. The colour is hashed from
         the term name, so P1 is the same hue on every degree page.

         The exam is an emoji while "Optional" is a word because the two run at
         very different frequencies: a mandatory exam is the norm in some
         degrees (~68% of MIEI courses) and rare in others (~4% of MEEC), so it
         has to stay light enough to repeat down a whole listing. A known
         elective is rare everywhere, so it can afford the word. Being a word is
         also what lets it stand alone: only the emoji needs a
         <CourseTableLegend> entry.

         "Exception" is meant across the catalogue, not within a page: a degree
         whose every course is elective still tags every row. `isMandatory` is
         null for ~78% of courses, so a bare row already means "mandatory or
         unknown", and suppressing the tag where it happens to run uniform would
         add "optional" to that list, leaving its absence saying nothing at all.
         The tag states a fact about a course, and readers carry its meaning
         from one degree to the next. The type *filter* is hidden when uniform
         and should be: a chip that cannot narrow is a no-op, so hiding it drops
         no fact. */
      meta={
        <>
          <span className="text-xs text-muted-foreground">
            {course.acronym}
          </span>
          {terms.map((term) => (
            <Chip
              key={term.label}
              label={term.label}
              color={term.color}
              size="xs"
            />
          ))}
          {course.hasMandatoryExam && (
            <span
              className="flex-shrink-0 text-xs"
              role="img"
              aria-label={t('degree_page.legend_mandatory_exam')}
              title={t('degree_page.legend_mandatory_exam')}
            >
              📝
            </span>
          )}
          {course.isMandatory === false && (
            <RowTag label={t('degree_page.tag_optional')} />
          )}
        </>
      }
    >
      {hasFeedback ? (
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className={`flex flex-shrink-0 items-center gap-1.5 ${COLUMN.rating}`}
          >
            <StarRating value={rating} size="sm" showHalfStars />
            {/* The review count rides along with the rating rather than owning a
                column: it is what says how much the rating can be trusted, and
                a column of its own gave a secondary number top billing. */}
            <span
              className="text-xs text-muted-foreground"
              title={t('browse_section.feedback_count', {
                count: course.totalFeedbackCount
              })}
            >
              {rating.toFixed(1)}{' '}
              <span className="text-muted-foreground/70">
                ({course.totalFeedbackCount})
              </span>
            </span>
          </div>
          <div className={`flex-shrink-0 ${COLUMN.workload}`}>
            {workload > 0 && <WorkloadRatingDisplay rating={workload} />}
          </div>
        </div>
      ) : (
        <Button
          variant="link"
          className="h-auto flex-shrink-0 justify-start p-0 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            analytics.navigation.feedbackFormLinkClicked({
              source: 'course_list_first_feedback',
              referrerPage: getPageName(window.location.pathname),
              courseId: course.id
            })
            navigate(
              `${getCourseFeedbackPath(lang, course.id)}?from=course_list`
            )
          }}
        >
          Give the first feedback!
        </Button>
      )}
    </ListingRow>
  )
}

/**
 * Explains the 📝 emoji, the one mark on a row that cannot speak for itself.
 * Renders only when some course in the listing carries it, so a degree with no
 * exam data never explains an emoji it never shows.
 *
 * Nothing else here earns an entry: the "Optional" tag and the workload badge
 * are words, and the stars are stars.
 */
function CourseTableLegend({ sections }: CourseListingProps) {
  const { t } = useTranslation('browse')
  const hasExamTag = sections.some((section) =>
    section.entries.some((entry) => entry.course.hasMandatoryExam)
  )

  if (!hasExamTag) return null

  return (
    <div className="mb-3 flex items-center gap-1.5 px-3 text-xs text-muted-foreground">
      <span aria-hidden="true">📝</span>
      {t('degree_page.legend_mandatory_exam')}
    </div>
  )
}

export function CourseTable({ sections }: CourseListingProps) {
  return (
    <div>
      <CourseTableLegend sections={sections} />
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.key}>
            {section.heading && (
              <h2 className="text-lg font-semibold text-foreground mb-2 border-b border-border pb-2">
                {section.heading}
              </h2>
            )}
            {section.entries.map((entry) => (
              <CourseRow
                key={`${section.key}-${entry.course.id}`}
                course={entry.course}
                terms={entry.terms}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
