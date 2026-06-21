import { sql } from 'drizzle-orm'
import { courses } from '../schema'

/**
 * Shape of an offering as returned by {@link offeringsSubquery}.
 * Mirrors the `CourseOffering` type in `@uni-feedback/api-client`.
 */
export interface CourseOfferingJson {
  curriculumYear: number | null
  academicTerm: {
    name: string
    startTick: number
    endTick: number
  }
}

/**
 * Correlated subquery that aggregates a course's offerings into a JSON array,
 * each entry `{ curriculumYear, academicTerm: { name, startTick, endTick } }`.
 *
 * Ordered `start_tick ASC, end_tick DESC` so container terms come before their
 * sub-terms. Returns `[]` for courses with no offerings. Use inside the
 * `.select({...})` of aggregation-heavy course queries (the relational API
 * can't aggregate); correlates on `courses.id`, so `courses` must be in scope.
 */
export function offeringsSubquery() {
  return sql<CourseOfferingJson[]>`COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'curriculumYear', o.curriculum_year,
        'academicTerm', jsonb_build_object(
          'name', t.name,
          'startTick', t.start_tick,
          'endTick', t.end_tick
        )
      )
      ORDER BY t.start_tick ASC, t.end_tick DESC
    )
    FROM course_offerings o
    JOIN academic_terms t ON t.id = o.academic_term_id
    WHERE o.course_id = ${courses.id}
  ), '[]'::jsonb)`
}
