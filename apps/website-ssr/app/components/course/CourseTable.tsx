import { Chip, WorkloadRatingDisplay } from '@uni-feedback/ui'
import { Dumbbell, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useLang, useWorkloadLabel } from '~/hooks'
import { analytics, getPageName } from '~/utils/analytics'
import { getCourseFeedbackPath, getCoursePath } from '~/utils/i18n-routes'
import { ListingRow } from '../common/ListingRow'
import { RowTag } from '../common/RowTag'
import { LastTaughtTag } from './LastTaughtTag'
import type { CourseListingEntry, CourseListingProps } from './types'

// The rating cell (star and average) has a fixed width at every size, a bit
// more than it needs: the workloads start at the same x down the listing, and
// the gap reads as a tab between two different facts.
const COLUMN = {
  rating: 'w-14'
}

/**
 * One course of a listing: name, acronym and tags, its rating and workload.
 * The course browser's plan listing (`PlanCourseList`) uses it too: `stacked`
 * in a semester column, `note` for "Também no 2.º semestre", `planSection` and
 * `filtered` for `course_card_clicked`.
 */
export function CourseRow({
  course,
  terms,
  positionInList,
  stacked = false,
  note,
  planSection,
  filtered,
  hideOptionalTag = false
}: CourseListingEntry & {
  positionInList: number
  stacked?: boolean
  note?: ReactNode
  planSection?: 'course' | 'pool_option' | 'not_in_plan'
  filtered?: boolean
  /** Inside a pool, which already says the course is a choice */
  hideOptionalTag?: boolean
}) {
  const { t } = useTranslation('browse')
  const workloadLabel = useWorkloadLabel()
  const lang = useLang()
  const navigate = useNavigate()

  const rating = Number(course.averageRating || 0)
  const workload = Number(course.averageWorkload || 0)
  const hasFeedback = course.totalFeedbackCount > 0

  return (
    <ListingRow
      href={getCoursePath(lang, course.id)}
      onClick={() => {
        // The "consumer browses a course" signal. The "give the first feedback"
        // button below stops propagation, so a review-intent click is not
        // counted as a browse.
        analytics.discovery.courseCardClicked({
          courseId: course.id,
          sourcePage: getPageName(window.location.pathname),
          positionInList,
          ...(planSection && { planSection, filtered: filtered ?? false })
        })
      }}
      title={course.name}
      stacked={stacked}
      // The acronym after the name, muted: students say "CDI", and search it
      suffix={course.acronym}
      quiet
      footnote={
        note && (
          <span className="text-xs italic text-muted-foreground">{note}</span>
        )
      }
      /* Tags flag only the exception (a term narrower than the section's, a
         known elective); the nullable defaults earn no tag.

         The term rides right after the acronym, and is the one tag that carries
         colour: within a section the terms are what split the courses into
         groups, and a colour makes that split scannable down the listing in a
         way a row of identical grey tags could not. The colour is hashed from
         the term name, so P1 is the same hue on every degree page.

         A mandatory exam has no mark (a 📝 until 2026-11-19): it is the norm
         in some degrees (~68% of MIEI courses), so a mark repeated down most
         rows was noise. The listing's "Exame" filter narrows on it, and the
         course page states it in its facts.

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
          {terms.map((term) => (
            <Chip
              key={term.label}
              label={term.label}
              color={term.color}
              size="xs"
            />
          ))}
          {course.isMandatory === false && !hideOptionalTag && (
            <RowTag label={t('degree_page.tag_optional')} />
          )}
          {/* A course no longer taught says when it last ran: the reviews
              under it describe editions up to that year */}
          <LastTaughtTag lastTaughtYear={course.lastTaughtYear} />
        </>
      }
    >
      {hasFeedback ? (
        // One star and the average, then a dumbbell and the workload: a row
        // reads as two facts, not five stars, a number, a pill and a count.
        // Both icons are grey outlines, labels for the facts; the number and
        // the workload's colour are what carry them. The rating cell has a
        // fixed width wider than its content: the gap after it, the same on
        // every row, says the two are different things, and lines the workloads
        // up. The count lives in the tooltip, for anyone weighing a 5.0 from
        // one feedback against a 4.2 from forty.
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className={`flex flex-shrink-0 items-center gap-1 ${COLUMN.rating}`}
            title={t('browse_section.feedback_count', {
              count: course.totalFeedbackCount
            })}
          >
            <Star
              aria-hidden="true"
              className="size-3.5 text-muted-foreground/60"
            />
            <span className="text-sm tabular-nums text-foreground">
              {rating.toFixed(1)}
            </span>
          </div>
          {workload > 0 && (
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <Dumbbell
                aria-hidden="true"
                className="size-3.5 text-muted-foreground/60"
              />
              <WorkloadRatingDisplay
                rating={workload}
                label={workloadLabel(workload)}
              />
            </div>
          )}
        </div>
      ) : (
        // No feedback yet: a fainter star where the rating goes, so the row keeps
        // the shape of the rated ones, and the ask for the first feedback. The
        // ask earns its place in exam season: in July 2026, 48 students
        // clicked it (77 clicks, ~1.8% of course opens from lists) and 21 of
        // them submitted that month; out of season it is near unused (~0.2%),
        // but quiet enough to keep.
        <div className="flex flex-shrink-0 items-center gap-1 whitespace-nowrap">
          <Star
            aria-hidden="true"
            className="size-3.5 text-muted-foreground/40"
          />
          <button
            type="button"
            className="cursor-pointer text-xs text-primaryBlue hover:underline"
            onClick={(e) => {
              // A review-intent click, not a browse: not a course_card_clicked
              e.stopPropagation()
              e.preventDefault()
              analytics.navigation.feedbackFormLinkClicked({
                source: 'course_list_first_feedback',
                referrerPage: getPageName(window.location.pathname),
                courseId: course.id
              })
              navigate(getCourseFeedbackPath(lang, course.id, 'course_list'))
            }}
          >
            {t('degree_page.first_feedback')}
          </button>
        </div>
      )}
    </ListingRow>
  )
}

export function CourseTable({
  sections,
  headingLevel = 'h2'
}: CourseListingProps & {
  /** 'h3' when the listing sits inside a page section with its own h2 */
  headingLevel?: 'h2' | 'h3'
}) {
  // Flat rank across sections, for `positionInList`.
  let position = 0
  const Heading = headingLevel

  return (
    <div>
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.key}>
            {section.group && (
              <h2
                id={section.group.id}
                className="mb-4 scroll-mt-(--sticky-offset) text-base font-semibold text-foreground md:text-lg"
              >
                {section.group.heading}
              </h2>
            )}
            {section.heading && (
              <Heading className="text-lg font-semibold text-foreground mb-2 border-b border-border pb-2">
                {section.heading}
              </Heading>
            )}
            {section.entries.map((entry) => (
              <CourseRow
                key={`${section.key}-${entry.course.id}`}
                course={entry.course}
                terms={entry.terms}
                positionInList={position++}
              />
            ))}
            {section.footer}
          </section>
        ))}
      </div>
    </div>
  )
}
