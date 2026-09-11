/**
 * End-to-end smoke test for the chat, against the real local database and a real
 * model. No HTTP, no auth: this exercises the service, the tools, the prompt and
 * the persistence in one go.
 *
 * This is the gate the plan puts before any production rollout: the flow has to
 * work locally, and the answers have to be read by hand, before 0038/0039 touch
 * production.
 *
 *   pnpm exec tsx src/scripts/chat-e2e.ts
 *   pnpm exec tsx src/scripts/chat-e2e.ts "Isto é difícil?" --scoped
 *
 * Creates a throwaway user and chat in the DEV database and deletes both on the
 * way out.
 */
import { DatabaseContext, database } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import {
  chatMessageEntities,
  chatMessages,
  chats,
  users
} from '@uni-feedback/db/schema'
import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ChatService } from '../services/chatService'

const sql = postgres(process.env.DATABASE_URL!, { max: 4 })
await DatabaseContext.run(drizzle(sql, { schema }), async () => {
  const db = database()
  const [user] = await db
    .insert(users)
    .values({
      email: `e2e-chat-${Date.now()}@tecnico.ulisboa.pt`,
      username: 'e2e-chat'
    })
    .returning()

  const service = new ChatService({
    WEBSITE_URL: 'https://uni-feedback.com',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
  } as Env)

  const question = process.argv[2] ?? 'O que dizem os alunos sobre AMS no IST?'
  const scoped = process.argv[3] === '--scoped'

  const chat = await service.createChat({
    userId: user.id,
    language: 'pt',
    scope: scoped ? { courseId: 5537, source: 'course_page' } : undefined
  })

  console.log(`\nQ: ${question}${scoped ? '  [scoped to course 5537]' : ''}\n`)
  const started = Date.now()
  const result = await service.sendMessage({
    chat,
    userId: user.id,
    content: question,
    onProgress: ({ tool }) => console.log(`   🔧 ${tool}`)
  })

  console.log(`\n${result.answer}\n`)
  console.log(
    `tools=${result.toolsUsed.join(',')} guards=${result.guardsFired.join(',') || 'none'} iterations=${result.iterations}`
  )
  console.log(
    `cost=${result.usage.costMicros} micros  in/out=${result.usage.inputTokens}/${result.usage.outputTokens}  ${((Date.now() - started) / 1000).toFixed(1)}s`
  )

  console.log(`gap: ${result.gap ? JSON.stringify(result.gap) : 'none'}`)

  const [assistant] = await db
    .select({ metadata: chatMessages.metadata })
    .from(chatMessages)
    .where(eq(chatMessages.id, result.assistantMessageId))
  console.log(
    `tool args: ${JSON.stringify((assistant?.metadata as { toolCalls?: unknown })?.toolCalls)}`
  )

  const title = await service.generateTitle(chat.id)
  console.log(`title: ${title}`)

  // Scoped to THIS answer. Unscoped, it dumped the whole table, so one turn
  // looked like it had written several hundred entity links when the real
  // number is single digits, which is alarming in exactly the wrong way for a
  // script whose job is to be the pre-rollout gate.
  const links = await db
    .select()
    .from(chatMessageEntities)
    .where(eq(chatMessageEntities.messageId, result.assistantMessageId))
  console.log(
    `entity links: ${links.map((l) => `${l.entityType}:${l.entityId}/${l.relation}`).join(' ')}`
  )
  console.log(`spend today: ${await service.spendTodayMicros()} micros`)

  // Clean up: this is the dev database, not a scratch one.
  await db.delete(chatMessages).where(eq(chatMessages.chatId, chat.id))
  await db.delete(chats).where(eq(chats.id, chat.id))
  await db.delete(users).where(eq(users.id, user.id))
  console.log('cleaned up')
})
await sql.end()
