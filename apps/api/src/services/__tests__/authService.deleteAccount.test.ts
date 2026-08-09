import { database } from '@uni-feedback/db'
import {
  chatAccessRequests,
  chatMessageFeedback,
  chatMessages,
  chats,
  feedbackFull,
  pointRegistry,
  users
} from '@uni-feedback/db/schema'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createCourse,
  createDegree,
  createFaculty,
  createUser
} from '../../../test/helpers'
import { cleanAllTables, withTestDb } from '../../../test/setup'
import { AuthService } from '../authService'

/**
 * The tripwire for account deletion.
 *
 * Every table that references `users` does so WITHOUT `ON DELETE CASCADE`, on
 * purpose: `deleteUserAccount()` transfers those rows to an anonymised user
 * before deleting the original. If a new user-linked table is ever added and the
 * transfer is forgotten, the delete fails loudly instead of silently destroying
 * data, and this test is what turns that failure into a red build.
 *
 * So the assertion that matters most is not any single expectation below, it is
 * that `deleteUserAccount()` completes at all with a fully populated user.
 */
describe('AuthService.deleteUserAccount', () => {
  let authService: AuthService

  beforeEach(async () => {
    await cleanAllTables()
    authService = new AuthService({} as Env)
  })

  it('deletes a user who has data in every user-linked table', async () => {
    await withTestDb(async () => {
      const db = database()
      const user = await createUser({ email: 'student@tecnico.ulisboa.pt' })
      const faculty = await createFaculty()
      const degree = await createDegree(faculty.id)
      const course = await createCourse(degree.id)

      await createApprovedFeedback(course.id, { userId: user.id, rating: 4 })
      await db.insert(pointRegistry).values({
        userId: user.id,
        amount: 10,
        sourceType: 'submit_feedback'
      })

      const [chat] = await db
        .insert(chats)
        .values({ userId: user.id, title: 'AMS' })
        .returning()
      const [message] = await db
        .insert(chatMessages)
        .values({
          chatId: chat.id,
          seq: 1,
          role: 'assistant',
          content: 'Students found AMS demanding.'
        })
        .returning()
      await db.insert(chatMessageFeedback).values({
        messageId: message.id,
        userId: user.id,
        rating: 'helpful'
      })
      await db.insert(chatAccessRequests).values({
        userId: user.id,
        email: user.email,
        facultyId: faculty.id
      })

      // The whole point: this must not throw.
      await authService.deleteUserAccount(user.id)

      const remaining = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
      expect(remaining).toHaveLength(0)
    })
  })

  it('keeps chats and their messages, reattached to the anonymised user', async () => {
    await withTestDb(async () => {
      const db = database()
      const user = await createUser()

      const [chat] = await db
        .insert(chats)
        .values({ userId: user.id, title: 'Física I' })
        .returning()
      await db.insert(chatMessages).values({
        chatId: chat.id,
        seq: 1,
        role: 'user',
        content: 'O que dizem os alunos sobre Física I?'
      })

      await authService.deleteUserAccount(user.id)

      const [survivingChat] = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chat.id))

      expect(survivingChat).toBeDefined()
      expect(survivingChat.title).toBe('Física I')
      // Reattached, not orphaned and not deleted.
      expect(survivingChat.userId).not.toBe(user.id)

      const [anonymised] = await db
        .select()
        .from(users)
        .where(eq(users.id, survivingChat.userId))
      expect(anonymised.username).toBe('deleted-user')

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.chatId, chat.id))
      expect(messages).toHaveLength(1)
    })
  })

  it('drops chat access requests rather than transferring them', async () => {
    await withTestDb(async () => {
      const db = database()
      const user = await createUser()
      const faculty = await createFaculty()

      await db.insert(chatAccessRequests).values({
        userId: user.id,
        email: user.email,
        facultyId: faculty.id
      })

      await authService.deleteUserAccount(user.id)

      // They carry an email address, which a deleted account must not keep, and
      // a waitlist entry has no meaning once the account is gone.
      const remaining = await db.select().from(chatAccessRequests)
      expect(remaining).toHaveLength(0)
    })
  })

  it('still preserves feedback, which the anonymised user inherits', async () => {
    await withTestDb(async () => {
      const db = database()
      const user = await createUser()
      const faculty = await createFaculty()
      const degree = await createDegree(faculty.id)
      const course = await createCourse(degree.id)
      await createApprovedFeedback(course.id, { userId: user.id, rating: 5 })

      await authService.deleteUserAccount(user.id)

      const feedback = await db.select().from(feedbackFull)
      expect(feedback).toHaveLength(1)
      expect(feedback[0].userId).not.toBe(user.id)
    })
  })
})
