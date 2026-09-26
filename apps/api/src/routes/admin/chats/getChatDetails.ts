import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import {
  chatMessageEntities,
  chatMessageFeedback,
  chatMessages,
  chats,
  courses,
  degrees,
  faculties,
  users
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { asc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const ChatDetailsParamsSchema = z.object({
  id: z.string().uuid()
})

const AdminChatEntitySchema = z.object({
  type: z.string(),
  id: z.number(),
  relation: z.string(),
  /** Resolved for courses, degrees and faculties; `#id` otherwise. */
  label: z.string()
})

const AdminChatMessageSchema = z.object({
  id: z.number(),
  seq: z.number(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
  model: z.string().nullable(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  costMicros: z.number().nullable(),
  latencyMs: z.number().nullable(),
  /** Tool calls, guards fired, iteration cap, gap. Debug material, shown raw. */
  metadata: z.record(z.string(), z.unknown()),
  rating: z
    .object({
      rating: z.string(),
      comment: z.string().nullable(),
      createdAt: z.string()
    })
    .nullable(),
  entities: z.array(AdminChatEntitySchema)
})

const AdminChatDetailSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  language: z.string().nullable(),
  userId: z.number(),
  userEmail: z.string(),
  userName: z.string(),
  context: z.object({
    facultyId: z.number().nullable(),
    facultyName: z.string().nullable(),
    facultyShortName: z.string().nullable(),
    degreeId: z.number().nullable(),
    degreeName: z.string().nullable(),
    degreeAcronym: z.string().nullable(),
    courseId: z.number().nullable(),
    courseName: z.string().nullable(),
    courseAcronym: z.string().nullable(),
    source: z.string().nullable()
  }),
  totals: z.object({
    messageCount: z.number(),
    costMicros: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number()
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastMessageAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  messages: z.array(AdminChatMessageSchema)
})

type EntityRow = typeof chatMessageEntities.$inferSelect

export class GetChatDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Chats'],
    summary: 'Read one chat transcript with its debug metadata',
    description:
      'The full conversation for one chat, including soft-deleted chats, with per-message model, tokens, cost, latency, tool calls, ratings and the entities each message touched.',
    request: {
      params: ChatDetailsParamsSchema
    },
    responses: {
      '200': {
        description: 'Chat retrieved successfully',
        content: {
          'application/json': {
            schema: AdminChatDetailSchema
          }
        }
      },
      '404': {
        description: 'Chat not found',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle() {
    const { params } = await this.getValidatedData<typeof this.schema>()
    const db = database()

    const [chat] = await db
      .select({
        id: chats.id,
        publicId: chats.publicId,
        title: chats.title,
        language: chats.language,
        userId: users.id,
        userEmail: users.email,
        userName: users.username,
        contextFacultyId: chats.contextFacultyId,
        contextFacultyName: faculties.name,
        contextFacultyShortName: faculties.shortName,
        contextDegreeId: chats.contextDegreeId,
        contextDegreeName: degrees.name,
        contextDegreeAcronym: degrees.acronym,
        contextCourseId: chats.contextCourseId,
        contextCourseName: courses.name,
        contextCourseAcronym: courses.acronym,
        contextSource: chats.contextSource,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        lastMessageAt: chats.lastMessageAt,
        deletedAt: chats.deletedAt
      })
      .from(chats)
      .innerJoin(users, eq(chats.userId, users.id))
      .leftJoin(faculties, eq(chats.contextFacultyId, faculties.id))
      .leftJoin(degrees, eq(chats.contextDegreeId, degrees.id))
      .leftJoin(courses, eq(chats.contextCourseId, courses.id))
      .where(eq(chats.publicId, params.id))
      .limit(1)

    if (!chat) {
      throw new NotFoundError('Chat not found')
    }

    // Every persisted row, tool traffic included if any ever lands here. The
    // student-facing endpoint filters to user/assistant; this one is for
    // debugging, so it hides nothing. Only the chat's owner can rate, so the
    // feedback join yields at most one row per message.
    const messages = await db
      .select({
        id: chatMessages.id,
        seq: chatMessages.seq,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        model: chatMessages.model,
        inputTokens: chatMessages.inputTokens,
        outputTokens: chatMessages.outputTokens,
        costMicros: chatMessages.costMicros,
        latencyMs: chatMessages.latencyMs,
        metadata: chatMessages.metadata,
        rating: chatMessageFeedback.rating,
        ratingComment: chatMessageFeedback.comment,
        ratingCreatedAt: chatMessageFeedback.createdAt
      })
      .from(chatMessages)
      .leftJoin(
        chatMessageFeedback,
        eq(chatMessageFeedback.messageId, chatMessages.id)
      )
      .where(eq(chatMessages.chatId, chat.id))
      .orderBy(asc(chatMessages.seq))

    const messageIds = messages.map((m) => m.id)
    const entities: EntityRow[] = messageIds.length
      ? await db
          .select()
          .from(chatMessageEntities)
          .where(inArray(chatMessageEntities.messageId, messageIds))
      : []

    const labels = await resolveEntityLabels(entities)

    const entitiesByMessage = new Map<number, EntityRow[]>()
    for (const entity of entities) {
      const list = entitiesByMessage.get(entity.messageId) ?? []
      list.push(entity)
      entitiesByMessage.set(entity.messageId, list)
    }

    const totals = messages.reduce(
      (acc, m) => ({
        messageCount:
          acc.messageCount +
          (m.role === 'user' || m.role === 'assistant' ? 1 : 0),
        costMicros: acc.costMicros + (m.costMicros ?? 0),
        inputTokens: acc.inputTokens + (m.inputTokens ?? 0),
        outputTokens: acc.outputTokens + (m.outputTokens ?? 0)
      }),
      { messageCount: 0, costMicros: 0, inputTokens: 0, outputTokens: 0 }
    )

    return Response.json({
      id: chat.publicId,
      title: chat.title,
      language: chat.language,
      userId: chat.userId,
      userEmail: chat.userEmail,
      userName: chat.userName,
      context: {
        facultyId: chat.contextFacultyId,
        facultyName: chat.contextFacultyName,
        facultyShortName: chat.contextFacultyShortName,
        degreeId: chat.contextDegreeId,
        degreeName: chat.contextDegreeName,
        degreeAcronym: chat.contextDegreeAcronym,
        courseId: chat.contextCourseId,
        courseName: chat.contextCourseName,
        courseAcronym: chat.contextCourseAcronym,
        source: chat.contextSource
      },
      totals,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      lastMessageAt: chat.lastMessageAt?.toISOString() ?? null,
      deletedAt: chat.deletedAt?.toISOString() ?? null,
      messages: messages.map((m) => ({
        id: m.id,
        seq: m.seq,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        model: m.model,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        costMicros: m.costMicros,
        latencyMs: m.latencyMs,
        metadata: m.metadata ?? {},
        rating:
          m.rating && m.ratingCreatedAt
            ? {
                rating: m.rating,
                comment: m.ratingComment,
                createdAt: m.ratingCreatedAt.toISOString()
              }
            : null,
        entities: (entitiesByMessage.get(m.id) ?? []).map((e) => ({
          type: e.entityType,
          id: e.entityId,
          relation: e.relation,
          label:
            labels.get(`${e.entityType}:${e.entityId}`) ??
            `${e.entityType} #${e.entityId}`
        }))
      }))
    })
  }
}

/**
 * Names for the entities a transcript touched, so the reader sees "LEIC-A"
 * rather than "degree #42". Universities and feedback rows keep their ids:
 * neither has a short label worth a fourth query.
 */
async function resolveEntityLabels(
  entities: EntityRow[]
): Promise<Map<string, string>> {
  const db = database()
  const labels = new Map<string, string>()

  const idsOf = (type: EntityRow['entityType']) => [
    ...new Set(
      entities.filter((e) => e.entityType === type).map((e) => e.entityId)
    )
  ]

  const courseIds = idsOf('course')
  const degreeIds = idsOf('degree')
  const facultyIds = idsOf('faculty')

  const [courseRows, degreeRows, facultyRows] = await Promise.all([
    courseIds.length
      ? db
          .select({
            id: courses.id,
            acronym: courses.acronym,
            name: courses.name
          })
          .from(courses)
          .where(inArray(courses.id, courseIds))
      : [],
    degreeIds.length
      ? db
          .select({
            id: degrees.id,
            acronym: degrees.acronym,
            name: degrees.name
          })
          .from(degrees)
          .where(inArray(degrees.id, degreeIds))
      : [],
    facultyIds.length
      ? db
          .select({ id: faculties.id, shortName: faculties.shortName })
          .from(faculties)
          .where(inArray(faculties.id, facultyIds))
      : []
  ])

  for (const c of courseRows) {
    labels.set(
      `course:${c.id}`,
      c.acronym ? `${c.acronym} · ${c.name}` : c.name
    )
  }
  for (const d of degreeRows) {
    labels.set(
      `degree:${d.id}`,
      d.acronym ? `${d.acronym} · ${d.name}` : d.name
    )
  }
  for (const f of facultyRows) {
    labels.set(`faculty:${f.id}`, f.shortName)
  }

  return labels
}
