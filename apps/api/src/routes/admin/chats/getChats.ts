import { PaginationQuerySchema, getPaginatedSchema } from '@types'
import { database } from '@uni-feedback/db'
import {
  chatMessageFeedback,
  chatMessages,
  chats,
  courses,
  degrees,
  faculties,
  users
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import {
  and,
  count,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  or,
  sql
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

const ChatsQuerySchema = PaginationQuerySchema.extend({
  email: z.string().optional(),
  faculty_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  language: z.enum(['pt', 'en']).optional(),
  /**
   * `not_helpful` is the one that matters: the PRD's cheapest detector for a
   * fluent wrong answer is a thumbs down, so "show me every chat with one" is
   * the first filter a weekly read reaches for.
   */
  rating: z.enum(['helpful', 'not_helpful', 'none']).optional(),
  deleted: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  created_after: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  /**
   * `random` exists for the weekly "read 20 random chats" ritual. Pagination
   * over a random order is meaningless, so callers should use page 1 only.
   */
  sort: z.enum(['recent', 'random']).optional()
})

const AdminChatSummarySchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  language: z.string().nullable(),
  userId: z.number(),
  userEmail: z.string(),
  userName: z.string(),
  context: z.object({
    facultyId: z.number().nullable(),
    facultyShortName: z.string().nullable(),
    degreeId: z.number().nullable(),
    degreeAcronym: z.string().nullable(),
    courseId: z.number().nullable(),
    courseAcronym: z.string().nullable(),
    source: z.string().nullable()
  }),
  firstQuestion: z.string().nullable(),
  messageCount: z.number(),
  totalCostMicros: z.number(),
  helpfulCount: z.number(),
  notHelpfulCount: z.number(),
  createdAt: z.string(),
  lastMessageAt: z.string().nullable(),
  deletedAt: z.string().nullable()
})

export class GetChats extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Chats'],
    summary: 'List AI chats across all users',
    description:
      'Paginated list of every chat, including soft-deleted ones, with per-chat message, cost and rating totals. Built for reading transcripts, not for the student-facing chat.',
    request: {
      query: ChatsQuerySchema
    },
    responses: {
      '200': {
        description: 'Chats retrieved successfully',
        content: {
          'application/json': {
            schema: getPaginatedSchema(AdminChatSummarySchema)
          }
        }
      }
    }
  }

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const {
      page,
      limit,
      email,
      faculty_id,
      language,
      rating,
      deleted,
      created_after,
      sort
    } = query

    const db = database()

    // Per-chat message totals. One row per chat, joined rather than
    // correlated, so the list stays one query however many chats there are.
    const messageStats = db
      .select({
        chatId: chatMessages.chatId,
        messageCount: sql<number>`count(*)::int`.as('message_count'),
        totalCostMicros:
          sql<number>`coalesce(sum(${chatMessages.costMicros}), 0)::int`.as(
            'total_cost_micros'
          )
      })
      .from(chatMessages)
      .where(sql`${chatMessages.role} in ('user', 'assistant')`)
      .groupBy(chatMessages.chatId)
      .as('message_stats')

    const ratingStats = db
      .select({
        chatId: chatMessages.chatId,
        helpfulCount:
          sql<number>`count(*) filter (where ${chatMessageFeedback.rating} = 'helpful')::int`.as(
            'helpful_count'
          ),
        notHelpfulCount:
          sql<number>`count(*) filter (where ${chatMessageFeedback.rating} = 'not_helpful')::int`.as(
            'not_helpful_count'
          )
      })
      .from(chatMessageFeedback)
      .innerJoin(
        chatMessages,
        eq(chatMessageFeedback.messageId, chatMessages.id)
      )
      .groupBy(chatMessages.chatId)
      .as('rating_stats')

    // A chat scoped to a degree or course may carry no faculty id of its own,
    // so the faculty filter has to look through the degree as well.
    const degreeOfCourse = alias(degrees, 'degree_of_course')

    const conditions = []

    if (email) {
      conditions.push(
        sql`LOWER(${users.email}) LIKE ${`%${email.toLowerCase()}%`}`
      )
    }

    if (faculty_id !== undefined) {
      conditions.push(
        or(
          eq(chats.contextFacultyId, faculty_id),
          eq(degrees.facultyId, faculty_id),
          eq(degreeOfCourse.facultyId, faculty_id)
        )
      )
    }

    if (language) {
      conditions.push(eq(chats.language, language))
    }

    if (rating === 'not_helpful') {
      conditions.push(sql`coalesce(${ratingStats.notHelpfulCount}, 0) > 0`)
    } else if (rating === 'helpful') {
      conditions.push(sql`coalesce(${ratingStats.helpfulCount}, 0) > 0`)
    } else if (rating === 'none') {
      conditions.push(
        sql`coalesce(${ratingStats.helpfulCount}, 0) + coalesce(${ratingStats.notHelpfulCount}, 0) = 0`
      )
    }

    if (deleted === true) {
      conditions.push(isNotNull(chats.deletedAt))
    } else if (deleted === false) {
      conditions.push(isNull(chats.deletedAt))
    }

    if (created_after !== undefined) {
      conditions.push(gt(chats.createdAt, created_after))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [totalResult] = await db
      .select({ count: count() })
      .from(chats)
      .innerJoin(users, eq(chats.userId, users.id))
      .leftJoin(degrees, eq(chats.contextDegreeId, degrees.id))
      .leftJoin(courses, eq(chats.contextCourseId, courses.id))
      .leftJoin(degreeOfCourse, eq(courses.degreeId, degreeOfCourse.id))
      .leftJoin(ratingStats, eq(ratingStats.chatId, chats.id))
      .where(whereClause)
    const total = totalResult.count
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit

    const orderBy =
      sort === 'random'
        ? sql`random()`
        : desc(sql`coalesce(${chats.lastMessageAt}, ${chats.createdAt})`)

    const rows = await db
      .select({
        id: chats.publicId,
        title: chats.title,
        language: chats.language,
        userId: users.id,
        userEmail: users.email,
        userName: users.username,
        contextFacultyId: chats.contextFacultyId,
        contextFacultyShortName: faculties.shortName,
        contextDegreeId: chats.contextDegreeId,
        contextDegreeAcronym: degrees.acronym,
        contextCourseId: chats.contextCourseId,
        contextCourseAcronym: courses.acronym,
        contextSource: chats.contextSource,
        // The student's opening question, which is what a list row should
        // show when the generated title is missing or too tidy to be useful.
        firstQuestion: sql<string | null>`(
          select m.content from chat_messages m
          where m.chat_id = ${chats.id} and m.role = 'user'
          order by m.seq asc limit 1
        )`,
        messageCount: sql<number>`coalesce(${messageStats.messageCount}, 0)`,
        totalCostMicros: sql<number>`coalesce(${messageStats.totalCostMicros}, 0)`,
        helpfulCount: sql<number>`coalesce(${ratingStats.helpfulCount}, 0)`,
        notHelpfulCount: sql<number>`coalesce(${ratingStats.notHelpfulCount}, 0)`,
        createdAt: chats.createdAt,
        lastMessageAt: chats.lastMessageAt,
        deletedAt: chats.deletedAt
      })
      .from(chats)
      .innerJoin(users, eq(chats.userId, users.id))
      .leftJoin(faculties, eq(chats.contextFacultyId, faculties.id))
      .leftJoin(degrees, eq(chats.contextDegreeId, degrees.id))
      .leftJoin(courses, eq(chats.contextCourseId, courses.id))
      .leftJoin(degreeOfCourse, eq(courses.degreeId, degreeOfCourse.id))
      .leftJoin(messageStats, eq(messageStats.chatId, chats.id))
      .leftJoin(ratingStats, eq(ratingStats.chatId, chats.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    return Response.json({
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        language: row.language,
        userId: row.userId,
        userEmail: row.userEmail,
        userName: row.userName,
        context: {
          facultyId: row.contextFacultyId,
          facultyShortName: row.contextFacultyShortName,
          degreeId: row.contextDegreeId,
          degreeAcronym: row.contextDegreeAcronym,
          courseId: row.contextCourseId,
          courseAcronym: row.contextCourseAcronym,
          source: row.contextSource
        },
        firstQuestion: row.firstQuestion,
        messageCount: Number(row.messageCount),
        totalCostMicros: Number(row.totalCostMicros),
        helpfulCount: Number(row.helpfulCount),
        notHelpfulCount: Number(row.notHelpfulCount),
        createdAt: row.createdAt.toISOString(),
        lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
        deletedAt: row.deletedAt?.toISOString() ?? null
      })),
      total,
      page,
      limit,
      totalPages
    })
  }
}
