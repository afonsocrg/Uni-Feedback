import type { CourseOffering } from '@uni-feedback/api-client'
import type { ChipColor } from '@uni-feedback/ui'

export interface CourseWithFeedback {
  id: number
  name: string
  acronym: string
  offerings: CourseOffering[]
  hasMandatoryExam: boolean | null
  isMandatory: boolean | null
  averageRating: number
  averageWorkload: number
  totalFeedbackCount: number
}

/**
 * A term tag on a course, coloured by the page so one term reads as one hue
 * across the whole listing.
 */
export interface CourseTermTag {
  label: string
  color: ChipColor
}

/**
 * A course as it appears in one section, with the terms it runs in there.
 *
 * `terms` names only terms narrower than the section's own, so a course taught
 * across all of "1st Year · S1" carries none and a P1 course carries just `P1`:
 * the section heading states the default, and a tag marks the exception. Courses
 * offered in several of a section's terms carry one tag each rather than
 * repeating as near-identical rows.
 */
export interface CourseListingEntry {
  course: CourseWithFeedback
  terms: CourseTermTag[]
}

/**
 * A titled group of courses, already filtered, sorted and grouped by the page.
 * `heading` is null when there is nothing to group by and the whole listing is
 * one flat section.
 */
export interface CourseSection {
  key: string
  heading: string | null
  entries: CourseListingEntry[]
}

/**
 * Shared by every course-listing component (`CourseCardGrid`, `CourseTable`),
 * so a page can swap one for another without touching its filtering or
 * grouping. Listings only decide how courses look: they never filter, sort or
 * regroup what they are handed.
 */
export interface CourseListingProps {
  sections: CourseSection[]
}
