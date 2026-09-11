import { CHAT_CONFIG } from '@config/chat'
import { database } from '@uni-feedback/db'
import type { Chat } from '@uni-feedback/db/schema'
import {
  chatMessageEntities,
  chatMessageFeedback,
  chatMessages,
  chats
} from '@uni-feedback/db/schema'
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import { ChatContextService, type ChatScope } from './chatContextService'
import { ChatGapDetector, type ChatGap } from './chatGap'
import { ChatLlmClient, type LlmMessage, type LlmUsage } from './chatLlm'
import {
  CHAT_SYSTEM_PROMPT,
  GROUNDING_CORRECTION,
  TITLE_PROMPT
} from './chatPrompt'
import { ChatToolExecutor, REVIEW_TOOL_NAMES } from './chatTools'

/**
 * Runs a chat turn: history in, grounded answer out, everything persisted.
 *
 * The two guards below are the reason this loop is not a thin wrapper around the
 * provider. Both enforce behaviour that **prompting provably could not buy** in
 * Phase 0, and both fire only in the failure case, so they cost nothing when the
 * prompt works.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md (Phase 2)
 */

export interface TurnResult {
  answer: string
  assistantMessageId: number
  usage: LlmUsage
  latencyMs: number
  iterations: number
  toolsUsed: string[]
  guardsFired: string[]
  hitIterationCap: boolean
  /** What retrieval went looking for and did not find, if anything. */
  gap: ChatGap | null
}

interface EntityRef {
  type: 'course' | 'degree' | 'faculty'
  id: number
}

/**
 * Detects an answer that puts words in students' mouths.
 *
 * Phase 0 regression: once the prompt demanded depth ("explain WHY it is hard",
 * "compare the curricula"), the model met that demand by INVENTING rather than by
 * fetching. Asked to compare IST with FCT NOVA it called only `search_degrees`
 * twice, then wrote "os estudantes destacam a exigência e a profundidade dos
 * cursos" having read zero reviews.
 *
 * Depth and grounding pull against each other, and this is the grounding side.
 */
const ATTRIBUTION_PATTERNS = [
  /\b(alunos|estudantes)\b[^.!?]{0,80}\b(dizem|disseram|mencionam|destacam|referem|acham|consideram|queixam|criticam|elogiam|apontam|descrevem|sentem|relatam)/i,
  /\b(segundo|de acordo com) os (alunos|estudantes)\b/i,
  /\bstudents\b[^.!?]{0,80}\b(say|said|mention|describe|note|report|find|found|complain|praise|highlight|feel)/i
]

export function attributesOpinionsWithoutReviews(
  answer: string,
  toolsUsed: string[]
): boolean {
  if (toolsUsed.some((t) => REVIEW_TOOL_NAMES.includes(t))) return false
  return ATTRIBUTION_PATTERNS.some((re) => re.test(answer))
}

/**
 * A reply that asks something without having looked anything up.
 *
 * The model cannot know a question is ambiguous before searching. Three prompt
 * rewrites, including an explicit numbered rule at the top, failed to stop it
 * asking "which university?" about a degree that exists at exactly one.
 *
 * Deliberately narrow: refusals and off-topic declines also skip the tools, and
 * forcing a search on those made them cost twice as much for nothing. Only a
 * *question* asked from zero knowledge is worth a retry.
 */
export function askedWithoutSearching(
  answer: string,
  toolsUsed: string[]
): boolean {
  return toolsUsed.length === 0 && answer.includes('?')
}

export class ChatService {
  private readonly llm: ChatLlmClient
  private readonly tools: ChatToolExecutor
  private readonly context: ChatContextService

  constructor(
    private readonly env: Env,
    deps: {
      llm?: ChatLlmClient
      tools?: ChatToolExecutor
      context?: ChatContextService
    } = {}
  ) {
    this.llm = deps.llm ?? new ChatLlmClient(env)
    this.tools = deps.tools ?? new ChatToolExecutor()
    this.context = deps.context ?? new ChatContextService()
  }

  // -------------------------------------------------------------------------
  // Limits
  // -------------------------------------------------------------------------

  /** Messages this user has sent today, for the quota. */
  async countMessagesToday(userId: number): Promise<number> {
    const since = startOfToday()
    const [row] = await database()
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .innerJoin(chats, eq(chatMessages.chatId, chats.id))
      .where(
        and(
          eq(chats.userId, userId),
          eq(chatMessages.role, 'user'),
          gte(chatMessages.createdAt, since)
        )
      )
    return Number(row?.count ?? 0)
  }

  /**
   * Total spend today across every user, in micro-euros.
   *
   * The kill switch this feeds has to exist before launch day, not after a bad
   * night. It degrades to "the chat is resting" rather than erroring.
   */
  async spendTodayMicros(): Promise<number> {
    const [row] = await database()
      .select({
        total: sql<number>`coalesce(sum(${chatMessages.costMicros}), 0)`
      })
      .from(chatMessages)
      .where(gte(chatMessages.createdAt, startOfToday()))
    return Number(row?.total ?? 0)
  }

  // -------------------------------------------------------------------------
  // Chats
  // -------------------------------------------------------------------------

  async createChat(input: {
    userId: number
    language?: string | null
    scope?: ChatScope
  }) {
    const [chat] = await database()
      .insert(chats)
      .values({
        userId: input.userId,
        language: input.language ?? null,
        contextFacultyId: input.scope?.facultyId ?? null,
        contextDegreeId: input.scope?.degreeId ?? null,
        contextCourseId: input.scope?.courseId ?? null,
        contextSource: input.scope?.source ?? null
      })
      .returning()
    return chat
  }

  /** Resolves the URL's public id to the row, scoped to its owner. */
  async findChat(publicId: string, userId: number) {
    const [chat] = await database()
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.publicId, publicId),
          eq(chats.userId, userId),
          isNull(chats.deletedAt)
        )
      )
      .limit(1)
    return chat ?? null
  }

  async listChats(userId: number, limit = 30) {
    return database()
      .select({
        // The internal id never leaves the server.
        id: chats.publicId,
        title: chats.title,
        createdAt: chats.createdAt,
        lastMessageAt: chats.lastMessageAt
      })
      .from(chats)
      .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
      .orderBy(desc(sql`coalesce(${chats.lastMessageAt}, ${chats.createdAt})`))
      .limit(limit)
  }

  /**
   * The conversation, optionally with the caller's own rating on each answer.
   *
   * `userId` is what scopes the rating join: one student must never see how
   * another rated an answer, and only their own is theirs to change.
   */
  async getMessages(chatId: number, userId?: number) {
    return database()
      .select({
        id: chatMessages.id,
        seq: chatMessages.seq,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        rating: chatMessageFeedback.rating
      })
      .from(chatMessages)
      .leftJoin(
        chatMessageFeedback,
        userId === undefined
          ? sql`false`
          : and(
              eq(chatMessageFeedback.messageId, chatMessages.id),
              eq(chatMessageFeedback.userId, userId)
            )
      )
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          // Tool traffic is persisted for debugging but is not conversation.
          sql`${chatMessages.role} in ('user', 'assistant')`
        )
      )
      .orderBy(chatMessages.seq)
  }

  /** Soft delete: hides the chat, never destroys the record. */
  async deleteChat(publicId: string, userId: number): Promise<boolean> {
    const result = await database()
      .update(chats)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(chats.publicId, publicId),
          eq(chats.userId, userId),
          isNull(chats.deletedAt)
        )
      )
      .returning({ id: chats.id })
    return result.length > 0
  }

  // -------------------------------------------------------------------------
  // The turn
  // -------------------------------------------------------------------------

  /**
   * Starts a conversation with its first message.
   *
   * One call, deliberately. Creating the chat and sending the first message
   * used to be two, and every gate (coverage, quota, kill switch) ran inside the
   * second one, so a refused send left an empty chat behind. The caller is
   * expected to have run the gates before this, and if the turn itself fails
   * before producing an answer the row is removed rather than stranded.
   *
   * It also means the chat is named the moment it exists: the title is
   * generated from the first exchange in the same request, so it never appears
   * in the sidebar as "Nova conversa".
   */
  async startChat(input: {
    userId: number
    content: string
    language?: string | null
    scope?: ChatScope
    onProgress?: (info: { tool: string }) => void
  }): Promise<{ chat: Chat; turn: TurnResult }> {
    const chat = await this.createChat({
      userId: input.userId,
      language: input.language,
      scope: input.scope
    })

    try {
      const turn = await this.sendMessage({
        chat,
        userId: input.userId,
        content: input.content,
        onProgress: input.onProgress
      })
      return { chat, turn }
    } catch (error) {
      // Nothing was said, so there is no conversation to keep. Hard delete: a
      // chat that never had a message is not a record of anything.
      await database().delete(chats).where(eq(chats.id, chat.id))
      throw error
    }
  }

  async sendMessage(input: {
    chat: Chat
    userId: number
    content: string
    /** Fired as each tool starts, so the UI can show what is happening. */
    onProgress?: (info: { tool: string }) => void
  }): Promise<TurnResult> {
    const started = Date.now()
    const chat = input.chat

    const nextSeq = await this.nextSeq(chat.id)
    await this.persistMessage({
      chatId: chat.id,
      seq: nextSeq,
      role: 'user',
      content: input.content,
      // On a user message this is what the STUDENT asked about, which is the
      // analytics gold. Populated below from the chat's scope, since we cannot
      // know what they meant until the model resolves it.
      entities: [],
      relation: 'mentioned'
    })

    const context = await this.context.build({
      facultyId: chat.contextFacultyId,
      degreeId: chat.contextDegreeId,
      courseId: chat.contextCourseId
    })

    // Seed the URL map with the context block's own entities: the model can cite
    // a link it read there rather than from a tool result, and a scoped chat is
    // the common case from a course-page entry point.
    const seededUrls = new Map<string, EntityRef>(
      context.entities.map((e) => [e.pageUrl, { type: e.type, id: e.id }])
    )

    const history = await this.buildHistory(chat.id)
    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: context.markdown
          ? `${CHAT_SYSTEM_PROMPT}\n\n${context.markdown}`
          : CHAT_SYSTEM_PROMPT
      },
      ...history
    ]

    const turn = await this.runToolLoop(messages, seededUrls, input.onProgress)

    const assistantSeq = nextSeq + 1
    const assistantMessageId = await this.persistMessage({
      chatId: chat.id,
      seq: assistantSeq,
      role: 'assistant',
      content: turn.answer,
      entities: turn.entities,
      relation: 'retrieved',
      citedEntities: citedFrom(turn.answer, turn.entityUrls),
      metadata: {
        toolCalls: turn.toolCalls,
        guardsFired: turn.guardsFired,
        hitIterationCap: turn.hitIterationCap,
        contextTokens: context.estimatedTokens,
        // What the turn looked for and did not find. Stored as well as sent, so
        // "which gaps do students hit most" is a query rather than a guess.
        gap: turn.gap
      },
      model: CHAT_CONFIG.model,
      usage: turn.usage,
      latencyMs: Date.now() - started
    })

    await database()
      .update(chats)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chats.id, chat.id))

    return {
      answer: turn.answer,
      assistantMessageId,
      usage: turn.usage,
      latencyMs: Date.now() - started,
      iterations: turn.iterations,
      toolsUsed: turn.toolsUsed,
      guardsFired: turn.guardsFired,
      hitIterationCap: turn.hitIterationCap,
      gap: turn.gap
    }
  }

  /**
   * The agent loop.
   *
   * Progress, not tokens. A tool-calling turn is not a single stream: it is
   * several provider calls with tool execution between them, and either guard
   * can restart it. The spike measured 3 to 14 seconds, so the honest signal for
   * the UI is "still working, and here is what I am doing".
   */
  private async runToolLoop(
    messages: LlmMessage[],
    entityUrls: Map<string, EntityRef>,
    onProgress?: (info: { tool: string }) => void
  ) {
    const usage: LlmUsage = { inputTokens: 0, outputTokens: 0, costMicros: 0 }
    const toolCalls: Array<{ name: string; args: unknown; ms: number }> = []
    const toolsUsed: string[] = []
    // Only calls that returned data. `toolsUsed` is the record of what the
    // model attempted, and is what gets logged and shown; the guards below have
    // to judge on what it actually READ. A `get_course_reviews` that threw put
    // no review in front of the model, so counting it would let an answer
    // speak for students on the strength of an error message.
    const toolsSucceeded: string[] = []
    const entities: EntityRef[] = []
    const guardsFired: string[] = []
    const gaps = new ChatGapDetector()

    let retriedSearch = false
    let retriedGrounding = false
    let forceToolCall = false
    let iterations = 0

    for (let i = 0; i < CHAT_CONFIG.maxToolIterations; i++) {
      iterations = i + 1

      const completion = await this.llm.complete({
        model: CHAT_CONFIG.model,
        messages,
        forceToolCall
      })
      forceToolCall = false

      usage.inputTokens += completion.usage.inputTokens
      usage.outputTokens += completion.usage.outputTokens
      usage.costMicros += completion.usage.costMicros

      const { message } = completion
      messages.push(message)

      const calls = message.tool_calls ?? []

      if (calls.length === 0) {
        const answer = message.content ?? ''

        // Guard 1: asked a question without looking anything up.
        if (!retriedSearch && askedWithoutSearching(answer, toolsSucceeded)) {
          retriedSearch = true
          guardsFired.push('forced_search')
          messages.pop()
          forceToolCall = true
          continue
        }

        // Guard 2: spoke for students without reading a review.
        if (
          !retriedGrounding &&
          attributesOpinionsWithoutReviews(answer, toolsSucceeded)
        ) {
          retriedGrounding = true
          guardsFired.push('grounding')
          messages.push({ role: 'user', content: GROUNDING_CORRECTION })
          continue
        }

        return {
          answer: answer || '(empty answer)',
          usage,
          toolCalls,
          toolsUsed,
          entities,
          entityUrls,
          guardsFired,
          iterations,
          hitIterationCap: false,
          gap: gaps.result()
        }
      }

      for (const call of calls) {
        const callStarted = Date.now()
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.function.arguments || '{}')
        } catch {
          args = {}
        }

        onProgress?.({ tool: call.function.name })

        let payload: unknown
        try {
          const result = await this.tools.execute(call.function.name, args)
          payload = result.payload
          // A payload of `{ error }` is the executor's own refusal (missing id,
          // unknown course) and put no data in front of the model either.
          if (!isErrorPayload(payload)) toolsSucceeded.push(call.function.name)
          for (const entity of result.entities) {
            if (
              !entities.some(
                (e) => e.type === entity.type && e.id === entity.id
              )
            ) {
              entities.push(entity)
            }
          }
          collectUrls(result.payload, entityUrls)
        } catch (error) {
          payload = {
            error: error instanceof Error ? error.message : String(error)
          }
        }

        gaps.observe(call.function.name, payload)

        toolsUsed.push(call.function.name)
        toolCalls.push({
          name: call.function.name,
          args,
          ms: Date.now() - callStarted
        })

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(payload)
        })
      }
    }

    return {
      answer:
        'Desculpa, não consegui chegar a uma resposta. Podes reformular a pergunta?',
      usage,
      toolCalls,
      toolsUsed,
      entities,
      entityUrls,
      guardsFired,
      iterations,
      hitIterationCap: true,
      gap: gaps.result()
    }
  }

  // -------------------------------------------------------------------------
  // Title
  // -------------------------------------------------------------------------

  /**
   * Names the chat from its first exchange, on the cheap tier.
   *
   * Best-effort: a chat without a title is a cosmetic problem, so a failure here
   * must never fail the turn that produced the answer.
   */
  async generateTitle(chatId: number): Promise<string | null> {
    try {
      const messages = await this.getMessages(chatId)
      if (messages.length < 2) return null

      const transcript = messages
        .slice(0, 2)
        .map((m) => `${m.role}: ${m.content.slice(0, 500)}`)
        .join('\n\n')

      const completion = await this.llm.complete({
        model: CHAT_CONFIG.cheapModel,
        withTools: false,
        maxTokens: 30,
        messages: [
          { role: 'system', content: TITLE_PROMPT },
          { role: 'user', content: transcript }
        ]
      })

      const title = (completion.message.content ?? '')
        .trim()
        .replace(/^["'“”]|["'“”]$/g, '')
        .slice(0, 80)
      if (!title) return null

      await database()
        .update(chats)
        .set({ title, updatedAt: new Date() })
        .where(eq(chats.id, chatId))

      return title
    } catch (error) {
      console.error('Failed to generate chat title:', error)
      return null
    }
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private async nextSeq(chatId: number): Promise<number> {
    const [row] = await database()
      .select({ max: sql<number>`coalesce(max(${chatMessages.seq}), 0)` })
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
    return Number(row?.max ?? 0) + 1
  }

  private async persistMessage(input: {
    chatId: number
    seq: number
    role: 'user' | 'assistant'
    content: string
    entities: EntityRef[]
    relation: 'mentioned' | 'retrieved'
    citedEntities?: EntityRef[]
    metadata?: Record<string, unknown>
    model?: string
    usage?: LlmUsage
    latencyMs?: number
  }): Promise<number> {
    const [message] = await database()
      .insert(chatMessages)
      .values({
        chatId: input.chatId,
        seq: input.seq,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
        model: input.model ?? null,
        inputTokens: input.usage?.inputTokens ?? null,
        outputTokens: input.usage?.outputTokens ?? null,
        costMicros: input.usage?.costMicros ?? null,
        latencyMs: input.latencyMs ?? null
      })
      .returning({ id: chatMessages.id })

    const rows = [
      ...input.entities.map((e) => ({
        messageId: message.id,
        entityType: e.type,
        entityId: e.id,
        relation: input.relation
      })),
      ...(input.citedEntities ?? []).map((e) => ({
        messageId: message.id,
        entityType: e.type,
        entityId: e.id,
        relation: 'cited' as const
      }))
    ]

    if (rows.length > 0) {
      await database()
        .insert(chatMessageEntities)
        .values(rows)
        .onConflictDoNothing()
    }

    return message.id
  }

  /** Conversation history, trimmed to the most recent turns. */
  private async buildHistory(chatId: number): Promise<LlmMessage[]> {
    const rows = await database()
      .select({
        role: chatMessages.role,
        content: chatMessages.content
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          sql`${chatMessages.role} in ('user', 'assistant')`
        )
      )
      .orderBy(desc(chatMessages.seq))
      .limit(CHAT_CONFIG.maxHistoryMessages)

    return rows
      .reverse()
      .map((r) => ({ role: r.role, content: r.content }) as LlmMessage)
  }
}

// ---------------------------------------------------------------------------

function isErrorPayload(payload: unknown): boolean {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    Object.keys(payload).length === 1
  )
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/**
 * Harvests pageUrl -> entity from a tool payload, so we can tell afterwards which
 * entities the answer actually linked to.
 *
 * `retrieved` and `cited` answer different questions: what we fetched, versus
 * what we actually showed the student. Splitting them is cheap now and impossible
 * to recover later.
 */
function collectUrls(node: unknown, into: Map<string, EntityRef>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectUrls(item, into)
    return
  }
  if (typeof node !== 'object' || node === null) return

  const record = node as Record<string, unknown>
  const url = record.pageUrl
  if (typeof url === 'string') {
    if (typeof record.courseId === 'number') {
      into.set(url, { type: 'course', id: record.courseId })
    } else if (typeof record.degreeId === 'number') {
      into.set(url, { type: 'degree', id: record.degreeId })
    } else if (typeof record.id === 'number') {
      into.set(url, { type: 'faculty', id: record.id })
    }
  }

  for (const value of Object.values(record)) collectUrls(value, into)
}

function citedFrom(answer: string, urls: Map<string, EntityRef>): EntityRef[] {
  const cited: EntityRef[] = []
  for (const [url, entity] of urls) {
    if (answer.includes(url)) cited.push(entity)
  }
  return cited
}
