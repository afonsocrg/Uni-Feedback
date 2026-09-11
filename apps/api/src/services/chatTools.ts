import { ChatRetrievalService } from './chatRetrievalService'

/**
 * The tool surface the model sees, and the dispatcher behind it.
 *
 * Separated from `ChatRetrievalService` on purpose: that service is a data
 * access layer with its own tests, while this file is prompt engineering that
 * happens to be typed. The descriptions below are instructions to a model and
 * will be tuned far more often than the queries are.
 *
 * Descriptions carry the lessons the spike paid for, because a rule the model
 * needs while choosing a tool belongs on the tool, not buried in a system prompt
 * it read a thousand tokens ago.
 */

export interface ToolCallResult {
  /** What the model sees. */
  payload: unknown
  /** Entities this call touched, for chat_message_entities. */
  entities: Array<{ type: 'course' | 'degree' | 'faculty'; id: number }>
}

export const CHAT_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'list_faculties',
      description:
        'List every university faculty Uni Feedback covers, with how many degrees, courses and student reviews we hold for each. Use it to check whether we cover a university before answering about it.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_courses',
      description:
        'Find courses by name or acronym, or list courses ranked by rating or workload. Call this first to turn a course the student named into a course_id. Returns candidates, not an answer. If `matchMode` is not "exact", the term the student typed found NOTHING and these are approximations: say so rather than presenting a guess as a hit.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Course name or acronym, e.g. "AMS" or "Análise Matemática". Omit to list or rank without a text filter.'
          },
          facultyName: {
            type: 'string',
            description:
              'Optional university filter. Any form works: "IST", "Técnico", "FCT", "Nova FCT".'
          },
          degreeAcronym: {
            type: 'string',
            description: 'Optional degree filter, e.g. "MEIC", "LEIC".'
          },
          curriculumYear: {
            type: 'number',
            description:
              'Only courses taught in this year of the degree plan (1, 2, 3...). Use it for "cadeiras do 3º ano".'
          },
          term: {
            type: 'string',
            description:
              'Only courses taught in a term whose name contains this, e.g. "1" for the first semester, "P1". Term names vary by faculty.'
          },
          hasMandatoryExam: {
            type: 'string',
            enum: ['any', 'yes', 'no'],
            // 'any' exists so there is something harmless to fill. See `flag()`.
            description:
              'Filter by whether the course has a mandatory exam. Use "any" (the default) unless the student explicitly asked about exams.'
          },
          sort: {
            type: 'string',
            enum: [
              'relevance',
              'rating',
              'review_count',
              'heaviest_workload',
              'lightest_workload'
            ],
            description:
              'Use "rating" for "best/worst rated". Use "heaviest_workload" for "hardest / most demanding / mais difíceis / mais trabalhosas". DIFFICULTY IS WORKLOAD, NOT RATING: a low rating means students disliked the course, which is a different thing from it being hard. Always pair a sort with minReviews, or one 5-star review outranks forty.'
          },
          minReviews: {
            type: 'number',
            description:
              'Only courses with at least this many reviews. Use 10 or more when ranking.'
          },
          limit: { type: 'number', description: 'Max results, default 10.' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_course',
      description:
        'Full record for one course: description, ECTS, assessment, which curriculum year and term it runs in, ratings, and how many reviews carry a written comment. Read `workloadLabel`, never the raw number: the workload scale is inverted (1 = very heavy, 5 = very light).',
      parameters: {
        type: 'object',
        properties: { courseId: { type: 'number' } },
        required: ['courseId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_course_reviews',
      description:
        'Real student review comments for a course, newest first. Quote them verbatim. Call this before saying anything about what students think: describing student opinion without reading a review is the one failure this product cannot survive.',
      parameters: {
        type: 'object',
        properties: {
          courseId: { type: 'number' },
          topic: {
            type: 'string',
            enum: ['teaching', 'assessment', 'materials', 'tips']
          },
          limit: {
            type: 'number',
            description: 'Max reviews, default 8, capped at 12.'
          }
        },
        required: ['courseId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_degrees',
      description:
        'Find degrees (licenciaturas, mestrados) by name or acronym, to turn a degree the student named into a degree_id. Students often use a variant we do not store ("LEIC-A" when the degree is "LEIC"), so when `matchMode` is not "exact", name the degree you actually found instead of claiming theirs does not exist.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          facultyName: { type: 'string' },
          limit: { type: 'number' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_degree',
      description:
        'Full record for one degree, including its curriculum: every course with its curriculum year, term, ECTS, mandatory-exam flag, rating and workload. Pass curriculumYear to get one year only, which is much smaller and cheaper than the whole plan.',
      parameters: {
        type: 'object',
        properties: {
          degreeId: { type: 'number' },
          curriculumYear: {
            type: 'number',
            description: 'Optional: only courses of this year of the plan.'
          }
        },
        required: ['degreeId']
      }
    }
  }
] as const

export const CHAT_TOOL_NAMES = CHAT_TOOL_DEFINITIONS.map(
  (t) => t.function.name
) as readonly string[]

/** Tool names that constitute "I have actually read a review". */
export const REVIEW_TOOL_NAMES = ['get_course_reviews']

type Args = Record<string, unknown>

/**
 * A number the caller actually meant.
 *
 * Zero is treated as absent, and that is not a shortcut. Models fill optional
 * parameters with placeholders rather than omitting them: an observed call for
 * "Computabilidade e Complexidade no IST" arrived as
 * `{query, facultyName: 'IST', curriculumYear: 0, minReviews: 0, term: '',
 * degreeAcronym: '', hasMandatoryExam: false}`. Passed through, that filters on
 * curriculum year 0, which no offering has, so a course we hold came back as
 * nothing found.
 *
 * The output of that is indistinguishable from an honest "we do not have it",
 * which is the failure this whole design is most afraid of. None of the numeric
 * parameters here has a meaningful zero (year 0, "at least 0 reviews", 0
 * results), so reading zero as absent is both safe and what the caller meant.
 */
function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value !== 0
    ? value
    : undefined
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * A tri-state flag, as a string with an explicit neutral value.
 *
 * Same placeholder problem as `num`, except `false` is a legitimate value here
 * ("courses without a mandatory exam"), so it cannot be ignored the way zero
 * can. A plain boolean is unusable: an unfilled one arrives as `false` and
 * silently hides every course that does have an exam.
 *
 * Two-value 'yes'/'no' is no better, and this was measured rather than guessed:
 * switching to it made the model fill 'yes', which is just as much a filter. The
 * model fills whatever the schema declares, so the only reliable defence is to
 * give it something inert to fill. Hence 'any', named as the default in the
 * description, mapping to no filter at all.
 */
function flag(value: unknown): boolean | undefined {
  if (value === 'yes' || value === true) return true
  if (value === 'no' || value === false) return false
  return undefined
}

export class ChatToolExecutor {
  constructor(
    private readonly retrieval: ChatRetrievalService = new ChatRetrievalService()
  ) {}

  async execute(name: string, args: Args): Promise<ToolCallResult> {
    switch (name) {
      case 'list_faculties': {
        const faculties = await this.retrieval.listFaculties()
        return {
          payload: faculties,
          entities: faculties.map((f) => ({
            type: 'faculty' as const,
            id: f.id
          }))
        }
      }

      case 'search_courses': {
        const result = await this.retrieval.searchCourses({
          query: str(args.query),
          facultyName: str(args.facultyName),
          degreeAcronym: str(args.degreeAcronym),
          curriculumYear: num(args.curriculumYear),
          term: str(args.term),
          hasMandatoryExam: flag(args.hasMandatoryExam),
          sort: str(args.sort) as never,
          minReviews: num(args.minReviews),
          limit: num(args.limit)
        })
        return {
          payload: result,
          entities: result.courses.map((c) => ({
            type: 'course' as const,
            id: c.courseId
          }))
        }
      }

      case 'get_course': {
        const courseId = num(args.courseId)
        if (courseId === undefined) {
          return { payload: { error: 'courseId is required' }, entities: [] }
        }
        const course = await this.retrieval.getCourse(courseId)
        if (!course) {
          // Never "it does not exist": our data is incomplete, and telling a
          // student a course is not real is worse than being unhelpful.
          return {
            payload: { error: `No course found with id ${courseId}` },
            entities: []
          }
        }
        return {
          payload: course,
          entities: [
            { type: 'course', id: course.courseId },
            { type: 'degree', id: course.degreeId },
            { type: 'faculty', id: course.facultyId }
          ]
        }
      }

      case 'get_course_reviews': {
        const courseId = num(args.courseId)
        if (courseId === undefined) {
          return { payload: { error: 'courseId is required' }, entities: [] }
        }
        const reviews = await this.retrieval.getCourseReviews({
          courseId,
          topic: str(args.topic) as never,
          limit: num(args.limit)
        })
        return {
          payload: reviews,
          entities: [{ type: 'course', id: courseId }]
        }
      }

      case 'search_degrees': {
        const result = await this.retrieval.searchDegrees({
          query: str(args.query),
          facultyName: str(args.facultyName),
          limit: num(args.limit)
        })
        return {
          payload: result,
          entities: result.degrees.map((d) => ({
            type: 'degree' as const,
            id: d.degreeId
          }))
        }
      }

      case 'get_degree': {
        const degreeId = num(args.degreeId)
        if (degreeId === undefined) {
          return { payload: { error: 'degreeId is required' }, entities: [] }
        }
        const degree = await this.retrieval.getDegree({
          degreeId,
          curriculumYear: num(args.curriculumYear)
        })
        if (!degree) {
          return {
            payload: { error: `No degree found with id ${degreeId}` },
            entities: []
          }
        }
        return {
          payload: degree,
          entities: [
            { type: 'degree', id: degree.degreeId },
            ...degree.curriculum.map((c) => ({
              type: 'course' as const,
              id: c.courseId
            }))
          ]
        }
      }

      default:
        return { payload: { error: `Unknown tool: ${name}` }, entities: [] }
    }
  }
}
