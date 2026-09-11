/**
 * What the turn went looking for and did not find.
 *
 * The chat is open to every logged-in student, whatever their university, so a
 * thin answer is handled here rather than at the door. When retrieval comes back
 * empty we say so, and the client turns that into an ask matched to the gap.
 *
 * **This is deliberately not a tool the model can call.** Phase 0's
 * generalisable lesson was that a behaviour which must always happen belongs in
 * the harness rather than the prompt; the mirror holds, and a write which must
 * never happen by accident should not be reachable by the model at all. A model
 * that flagged a gap because a student sounded disappointed would give us rows
 * we could not trust. Nothing here needs inferring: we know which tools ran and
 * what came back.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md, "The gap ask, and who it should be
 * aimed at".
 */

export type ChatGapKind = 'no_reviews' | 'missing_field' | 'no_courses'

export interface ChatGap {
  kind: ChatGapKind
  /** Which field is missing. Only set for `missing_field`. */
  field?: 'description' | 'assessment'
  courseId?: number
  courseName?: string
  /** The real page URL, taken from the tool payload. Never constructed here. */
  courseUrl?: string
  degreeId?: number
  facultyId?: number
}

interface SeenCourse {
  courseId: number
  name?: string
  pageUrl?: string
  degreeId?: number
  facultyId?: number
  hasDescription: boolean
}

function record(payload: unknown): Record<string, unknown> | null {
  if (typeof payload !== 'object' || payload === null) return null
  if ('error' in payload) return null
  return payload as Record<string, unknown>
}

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Accumulates what each tool returned during one turn.
 *
 * Every rule below requires that the turn actually *tried*: a gap is only real
 * if a lookup ran and came back empty. That matters because the failure this
 * design most has to avoid is the confident false negative, and reporting a gap
 * nobody looked for is the same mistake wearing a different hat.
 */
export class ChatGapDetector {
  private reviewCalls = 0
  private reviewsReturned = 0
  private reviewCourseIds: number[] = []
  private courses: SeenCourse[] = []
  private searchCalls = 0
  private searchHits = 0

  observe(toolName: string, payload: unknown): void {
    const data = record(payload)
    if (!data) return

    switch (toolName) {
      case 'get_course_reviews': {
        this.reviewCalls += 1
        this.reviewsReturned += Number(data.returned ?? 0)
        const courseId = Number(data.courseId)
        if (Number.isFinite(courseId)) this.reviewCourseIds.push(courseId)
        return
      }

      case 'get_course': {
        const courseId = Number(data.courseId)
        if (!Number.isFinite(courseId)) return
        this.courses.push({
          courseId,
          name: typeof data.name === 'string' ? data.name : undefined,
          pageUrl: typeof data.pageUrl === 'string' ? data.pageUrl : undefined,
          degreeId: Number.isFinite(Number(data.degreeId))
            ? Number(data.degreeId)
            : undefined,
          facultyId: Number.isFinite(Number(data.facultyId))
            ? Number(data.facultyId)
            : undefined,
          hasDescription: nonEmpty(data.description)
        })
        return
      }

      case 'search_courses': {
        this.searchCalls += 1
        const courses = data.courses
        if (Array.isArray(courses)) this.searchHits += courses.length
        return
      }

      case 'search_degrees': {
        this.searchCalls += 1
        const degrees = data.degrees
        if (Array.isArray(degrees)) this.searchHits += degrees.length
        return
      }
    }
  }

  /**
   * The single most actionable gap, or null.
   *
   * One gap per turn, not a list. An answer that ends in three different asks is
   * an answer nobody acts on, and the point of this is a next step rather than a
   * complete account of what we are missing.
   */
  result(): ChatGap | null {
    // Reviews first: it is the most common disappointment and the only ask that
    // needs a different person entirely (see below).
    if (this.reviewCalls > 0 && this.reviewsReturned === 0) {
      const courseId = this.reviewCourseIds[0]
      const known = this.courses.find((c) => c.courseId === courseId)
      return {
        kind: 'no_reviews',
        courseId,
        courseName: known?.name,
        courseUrl: known?.pageUrl,
        degreeId: known?.degreeId,
        facultyId: known?.facultyId
      }
    }

    // A description is public on the university's own site, so anyone can
    // contribute it, including the student who has not taken the course.
    if (
      this.courses.length > 0 &&
      this.courses.every((c) => !c.hasDescription)
    ) {
      const course = this.courses[0]
      return {
        kind: 'missing_field',
        field: 'description',
        courseId: course.courseId,
        courseName: course.name,
        courseUrl: course.pageUrl,
        degreeId: course.degreeId,
        facultyId: course.facultyId
      }
    }

    // Nothing resolved at all. Sending them to the course page would be sending
    // them to a page that does not exist, so this one goes to the add form.
    if (
      this.searchCalls > 0 &&
      this.searchHits === 0 &&
      this.courses.length === 0
    ) {
      return { kind: 'no_courses' }
    }

    return null
  }
}
