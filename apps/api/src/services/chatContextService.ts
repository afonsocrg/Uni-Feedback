import { ChatRetrievalService } from './chatRetrievalService'

/**
 * Turns a chat's scope into a compact markdown block for the system prompt.
 *
 * A chat can be scoped to a faculty, degree or course, either because the
 * student arrived from that page ("ask about this course") or because they
 * picked it in the selector. That scope is stored on `chats.context_*`, and this
 * is what renders it for the model.
 *
 * **Why this matters more than it looks.** Almost every failure in the Phase 0
 * spike was ambiguity: "LEIC-A" not resolving, "FCT" versus "Nova FCT", which
 * university Medicina Dentária belongs to, whether "Engenharia Informática" meant
 * the bachelor or the master. When the scope is already known, that entire class
 * of problem disappears before the model makes its first tool call.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md (Phase 1, section 4).
 */

/**
 * Hard ceiling on the rendered block.
 *
 * This is prepended to every single turn, so it is paid for on every message in
 * the conversation, not once. A course description alone can run past a thousand
 * tokens, and the spike showed comparison questions already reaching 34k input
 * tokens without any of this.
 */
const MAX_CONTEXT_TOKENS = 700

/** Truncation floor for the description, below which it is dropped entirely. */
const MIN_USEFUL_DESCRIPTION_CHARS = 120

export interface ChatScope {
  facultyId?: number | null
  degreeId?: number | null
  courseId?: number | null
  source?: string | null
}

export interface ChatContextEntity {
  type: 'course' | 'degree' | 'faculty'
  id: number
}

export interface ChatContext {
  /** Markdown to prepend to the system prompt. Empty when the chat is unscoped. */
  markdown: string
  /** Entities the block names, for writing chat_message_entities rows. */
  entities: ChatContextEntity[]
  estimatedTokens: number
  /** True when something had to be dropped or shortened to fit the budget. */
  truncated: boolean
}

const EMPTY_CONTEXT: ChatContext = {
  markdown: '',
  entities: [],
  estimatedTokens: 0,
  truncated: false
}

/**
 * Rough token estimate: about four characters per token for the PT/EN mix we
 * deal with.
 *
 * Deliberately approximate. The budget is a safety net against a runaway
 * description, not an accounting figure, and a real tokenizer would mean pulling
 * in a dependency and pinning it to whichever model is in use this week. If exact
 * numbers ever matter, the provider reports real usage per message and we store
 * it on `chat_messages.input_tokens`.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Pushes a description's own headings below the block's own.
 *
 * Course descriptions are markdown scraped from university pages and routinely
 * open sections with `## Objetivos` / `## Programa`. Dropped in as-is those sit
 * at the same level as this block's `## Conversation context`, so the
 * description escapes the section it belongs to and the prompt's structure stops
 * meaning anything.
 *
 * Two levels, not one: the description sits under a `###` heading, so demoting
 * `##` by one would only draw it level with that.
 */
function demoteHeadings(markdown: string): string {
  return markdown.replace(/^(#{1,4})\s/gm, '##$1 ')
}

export class ChatContextService {
  constructor(
    private readonly retrieval: ChatRetrievalService = new ChatRetrievalService()
  ) {}

  async build(scope: ChatScope): Promise<ChatContext> {
    if (!scope.courseId && !scope.degreeId && !scope.facultyId) {
      return EMPTY_CONTEXT
    }

    if (scope.courseId) return this.buildCourseContext(scope.courseId)
    if (scope.degreeId) return this.buildDegreeContext(scope.degreeId)
    return this.buildFacultyContext(scope.facultyId as number)
  }

  // -------------------------------------------------------------------------

  private async buildCourseContext(courseId: number): Promise<ChatContext> {
    const course = await this.retrieval.getCourse(courseId)
    // A scope pointing at something that no longer exists is not an error worth
    // failing a chat over. Drop it and let the model work unscoped.
    if (!course) return EMPTY_CONTEXT

    const lines: string[] = [
      '## Conversation context',
      '',
      `The student is asking about the course **${course.name}** (${course.acronym}).`,
      `- Degree: ${course.degreeName} (${course.degreeAcronym})`,
      `- University: ${course.facultyName} (${course.facultyShortName})`
    ]

    if (course.ects !== null) lines.push(`- ECTS: ${course.ects}`)

    if (course.offerings.length > 0) {
      const when = course.offerings
        .map((o) =>
          o.curriculumYear
            ? `year ${o.curriculumYear}, ${o.term}`
            : String(o.term)
        )
        .join('; ')
      lines.push(`- Taught in: ${when}`)
    }

    lines.push(
      `- Reviews: ${course.reviewCount} (${course.commentedReviewCount} with a written comment)`
    )
    if (course.averageRating !== null) {
      lines.push(`- Average rating: ${course.averageRating.toFixed(2)} / 5`)
    }
    if (course.workloadLabel) {
      lines.push(`- Workload: ${course.workloadLabel}`)
    }
    lines.push(`- Page: ${course.pageUrl}`)
    lines.push(`- course_id for the tools: ${course.courseId}`)

    const entities: ChatContextEntity[] = [
      { type: 'course', id: course.courseId },
      { type: 'degree', id: course.degreeId },
      { type: 'faculty', id: course.facultyId }
    ]

    return this.finish(lines, course.description, entities, [
      'Assume questions are about this course unless the student clearly asks about something else.',
      'You already have its id, so do not search for it again.'
    ])
  }

  private async buildDegreeContext(degreeId: number): Promise<ChatContext> {
    const degree = await this.retrieval.getDegree({ degreeId })
    if (!degree) return EMPTY_CONTEXT

    const lines: string[] = [
      '## Conversation context',
      '',
      `The student is asking about the degree **${degree.name}** (${degree.acronym}).`,
      `- Type: ${degree.type}`,
      `- University: ${degree.facultyName} (${degree.facultyShortName})`,
      `- Courses: ${degree.courseCount ?? degree.curriculum.length}`,
      `- Reviews across the degree: ${degree.reviewCount ?? 0}`,
      `- Page: ${degree.pageUrl}`,
      `- degree_id for the tools: ${degree.degreeId}`
    ]

    // The curriculum is deliberately NOT inlined: a master's plan runs to 60
    // courses, which would blow the budget on every single turn. get_degree
    // fetches it on demand, and takes a curriculum_year to keep that cheap too.

    return this.finish(
      lines,
      degree.description,
      [{ type: 'degree', id: degree.degreeId }],
      [
        'Assume questions are about this degree and its courses unless the student clearly asks about something else.',
        'Use get_degree with this id for the curriculum, and pass curriculum_year when the question is about one year.'
      ]
    )
  }

  private async buildFacultyContext(facultyId: number): Promise<ChatContext> {
    const faculties = await this.retrieval.listFaculties()
    const faculty = faculties.find((f) => f.id === facultyId)
    if (!faculty) return EMPTY_CONTEXT

    const lines: string[] = [
      '## Conversation context',
      '',
      `The student is asking about **${faculty.name}** (${faculty.shortName}).`,
      `- Degrees: ${faculty.degreeCount}`,
      `- Courses: ${faculty.courseCount}`,
      `- Reviews: ${faculty.reviewCount}`,
      `- Page: ${faculty.pageUrl}`
    ]

    return this.finish(
      lines,
      null,
      [{ type: 'faculty', id: faculty.id }],
      [
        'Restrict searches to this university unless the student asks to compare with another one.',
        `Pass "${faculty.shortName}" as the faculty when searching.`
      ]
    )
  }

  // -------------------------------------------------------------------------

  /**
   * Assembles the block within budget.
   *
   * The identity lines and the usage notes are never dropped: they are what makes
   * the context worth having. The description is the only elastic part, so it is
   * shortened to whatever room is left, and dropped entirely rather than cut to a
   * fragment too short to inform anything.
   */
  private finish(
    lines: string[],
    description: string | null,
    entities: ChatContextEntity[],
    notes: string[]
  ): ChatContext {
    const notesBlock = ['', ...notes.map((n) => `- ${n}`)]
    const fixed = [...lines, ...notesBlock].join('\n')
    const fixedTokens = estimateTokens(fixed)

    if (!description) {
      return {
        markdown: fixed,
        entities,
        estimatedTokens: fixedTokens,
        truncated: false
      }
    }

    const remainingTokens = MAX_CONTEXT_TOKENS - fixedTokens
    const header = '\n\n### Description\n\n'
    const budgetChars = remainingTokens * 4 - header.length

    if (budgetChars < MIN_USEFUL_DESCRIPTION_CHARS) {
      return {
        markdown: fixed,
        entities,
        estimatedTokens: fixedTokens,
        truncated: true
      }
    }

    // Two caps apply, and in practice the retrieval one bites first: descriptions
    // arrive already clipped to MAX_TEXT_FIELD_CHARS, marked with a trailing
    // ellipsis. So the budget below is a backstop for when the fixed lines grow,
    // not the usual path. `truncated` reports what the caller actually cares
    // about either way: the description in this block is not the whole thing.
    const alreadyElided = description.endsWith('…')
    const overBudget = description.length > budgetChars
    const body = overBudget
      ? `${description.slice(0, budgetChars).trimEnd()}…`
      : description
    const truncated = overBudget || alreadyElided

    const markdown = [
      ...lines,
      '',
      header.trim(),
      '',
      demoteHeadings(body),
      ...notesBlock
    ].join('\n')

    return {
      markdown,
      entities,
      estimatedTokens: estimateTokens(markdown),
      truncated
    }
  }
}
