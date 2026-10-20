import { database } from '@uni-feedback/db'
import {
  chatMessageFeedback,
  chatMessages,
  chats,
  users
} from '@uni-feedback/db/schema'
import { eq } from 'drizzle-orm'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createApprovedFeedback,
  createAuthenticatedUser,
  createCourse,
  createDegree,
  createFaculty,
  createUnapprovedFeedback,
  createUser
} from '../../../../../test/helpers'
import { cleanAllTables, testEnv, withTestDb } from '../../../../../test/setup'
import { app } from '../../../../routes/router'

/**
 * Admin user pages: the user detail route, the user update route, and the
 * `user_id` author filter on the admin feedback list. Routed through the real
 * app so the role gating on role changes is exercised, not mocked.
 */
describe('Admin user routes', () => {
  beforeEach(async () => {
    await cleanAllTables()
  })

  async function seed() {
    const faculty = await createFaculty({ shortName: 'IST' })
    const degree = await createDegree(faculty.id, { acronym: 'LEIC-A' })
    const course = await createCourse(degree.id, { acronym: 'AMS' })
    const referrer = await createUser({ email: 'referrer@tecnico.ulisboa.pt' })
    const student = await createUser({
      email: 'alice@tecnico.ulisboa.pt',
      username: 'alice',
      instagramHandle: 'alice.ig',
      referredByUserId: referrer.id
    })
    // Two linked rows (one pending) plus one legacy email-only row that
    // shares the email but has no account. The author filter must skip it.
    const approved = await createApprovedFeedback(course.id, {
      userId: student.id,
      email: student.email
    })
    const pending = await createUnapprovedFeedback(course.id, {
      userId: student.id,
      email: student.email
    })
    const legacy = await createApprovedFeedback(course.id, {
      userId: null,
      email: student.email
    })
    // One live chat and one soft-deleted chat for the student, one for the
    // referrer so the user filter has something to exclude.
    const [studentChat] = await database()
      .insert(chats)
      .values({ userId: student.id, title: 'AMS workload', language: 'pt' })
      .returning()
    const [deletedChat] = await database()
      .insert(chats)
      .values({ userId: student.id, language: 'en', deletedAt: new Date() })
      .returning()
    const [referrerChat] = await database()
      .insert(chats)
      .values({ userId: referrer.id, title: 'Other', language: 'pt' })
      .returning()
    // Student: two turns with a thumbs down and known costs. Referrer: one
    // turn, which the student's totals must not pick up.
    const [, a1] = await database()
      .insert(chatMessages)
      .values([
        { chatId: studentChat.id, seq: 1, role: 'user', content: 'q1' },
        {
          chatId: studentChat.id,
          seq: 2,
          role: 'assistant',
          content: 'a1',
          costMicros: 12000
        },
        { chatId: deletedChat.id, seq: 1, role: 'user', content: 'q2' },
        {
          chatId: deletedChat.id,
          seq: 2,
          role: 'assistant',
          content: 'a2',
          costMicros: 3000
        },
        { chatId: referrerChat.id, seq: 1, role: 'user', content: 'other' },
        {
          chatId: referrerChat.id,
          seq: 2,
          role: 'assistant',
          content: 'other a',
          costMicros: 99000
        }
      ])
      .returning()
    await database()
      .insert(chatMessageFeedback)
      .values({ messageId: a1.id, userId: student.id, rating: 'not_helpful' })
    return {
      faculty,
      course,
      referrer,
      student,
      approved,
      pending,
      legacy,
      studentChat,
      deletedChat
    }
  }

  const json = async (res: Response) => res.json()

  describe('GET /admin/users/:id', () => {
    it('returns account fields with feedback counts and the referrer', async () => {
      await withTestDb(async () => {
        const { student, referrer } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const res = await app.request(
          `/admin/users/${student.id}`,
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(200)
        const body = await json(res)
        expect(body.email).toBe('alice@tecnico.ulisboa.pt')
        expect(body.username).toBe('alice')
        expect(body.role).toBe('student')
        expect(body.instagramHandle).toBe('alice.ig')
        expect(body.referredByUserId).toBe(referrer.id)
        expect(body.referredByEmail).toBe('referrer@tecnico.ulisboa.pt')
        expect(body.feedbackCount).toBe(2)
        expect(body.approvedFeedbackCount).toBe(1)
        expect(body.chatCount).toBe(2)
        expect(body.referralCount).toBe(0)
        expect(body.journeyDegreeCount).toBe(0)
      })
    })

    it('is superuser-only, like every /admin/users route', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const admin = await createAuthenticatedUser('admin')
        const headers = { Cookie: admin.cookie }
        const forbidden: [string, string][] = [
          ['GET', '/admin/users'],
          ['GET', '/admin/users/search?q=a'],
          ['GET', `/admin/users/${student.id}`],
          ['PUT', `/admin/users/${student.id}`],
          ['GET', `/admin/users/${student.id}/referrals`],
          ['GET', `/admin/users/${student.id}/chat-stats`],
          ['GET', `/admin/users/${student.id}/journey`],
          ['POST', `/admin/users/${student.id}/journey/degrees`],
          ['PUT', `/admin/users/${student.id}/journey/degrees/1`],
          ['DELETE', `/admin/users/${student.id}/journey/degrees/1`]
        ]
        for (const [method, path] of forbidden) {
          const res = await app.request(
            path,
            {
              method,
              headers: { ...headers, 'Content-Type': 'application/json' },
              body:
                method === 'PUT'
                  ? JSON.stringify({ username: 'x' })
                  : method === 'POST' || method === 'PUT'
                    ? JSON.stringify({ degreeId: 1 })
                    : undefined
            },
            testEnv
          )
          expect(res.status, `${method} ${path}`).toBe(403)
        }
      })
    })

    it('404s for a missing user', async () => {
      await withTestDb(async () => {
        const { cookie } = await createAuthenticatedUser('super_admin')
        const res = await app.request(
          '/admin/users/999999',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(404)
      })
    })
  })

  describe('PUT /admin/users/:id', () => {
    const put = (cookie: string, id: number, body: unknown) =>
      app.request(
        `/admin/users/${id}`,
        {
          method: 'PUT',
          headers: { Cookie: cookie, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        testEnv
      )

    it('edits username, email and instagram', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const res = await put(cookie, student.id, {
          username: 'Alice S.',
          email: 'Alice.New@Tecnico.ULisboa.pt',
          instagramHandle: '@alice_new'
        })
        expect(res.status).toBe(200)
        const body = await json(res)
        expect(body.username).toBe('Alice S.')
        expect(body.email).toBe('alice.new@tecnico.ulisboa.pt')
        expect(body.instagramHandle).toBe('alice_new')

        const [row] = await database()
          .select()
          .from(users)
          .where(eq(users.id, student.id))
        expect(row.email).toBe('alice.new@tecnico.ulisboa.pt')
        expect(row.role).toBe('student')
      })
    })

    it('clears instagram with null or an empty string', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')
        expect(
          (await put(cookie, student.id, { instagramHandle: '' })).status
        ).toBe(200)
        const [row] = await database()
          .select()
          .from(users)
          .where(eq(users.id, student.id))
        expect(row.instagramHandle).toBeNull()
      })
    })

    it('rejects an email another account already uses', async () => {
      await withTestDb(async () => {
        const { student, referrer } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')
        const res = await put(cookie, student.id, { email: referrer.email })
        expect(res.status).toBe(409)
      })
    })

    it('rejects an empty body and an invalid email', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')
        expect((await put(cookie, student.id, {})).status).toBe(400)
        expect(
          (await put(cookie, student.id, { email: 'not-an-email' })).status
        ).toBe(400)
      })
    })

    it('changes the role and keeps the legacy superuser flag in step', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const su = await createAuthenticatedUser('super_admin')
        const ok = await put(su.cookie, student.id, { role: 'admin' })
        expect(ok.status).toBe(200)
        const [row] = await database()
          .select()
          .from(users)
          .where(eq(users.id, student.id))
        expect(row.role).toBe('admin')
        expect(row.superuser).toBe(false)

        const promoted = await put(su.cookie, student.id, {
          role: 'super_admin'
        })
        expect(promoted.status).toBe(200)
        const [row2] = await database()
          .select()
          .from(users)
          .where(eq(users.id, student.id))
        expect(row2.superuser).toBe(true)
      })
    })

    it('a superuser cannot change their own role', async () => {
      await withTestDb(async () => {
        const su = await createAuthenticatedUser('super_admin')
        const res = await put(su.cookie, su.user.id, { role: 'student' })
        expect(res.status).toBe(400)
      })
    })

    it('students cannot touch it', async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const { cookie } = await createAuthenticatedUser('student')
        expect((await put(cookie, student.id, { username: 'x' })).status).toBe(
          403
        )
      })
    })
  })

  describe('GET /admin/users', () => {
    it('lists accounts with feedback, chat and referral counts', async () => {
      await withTestDb(async () => {
        const { student, referrer } = await seed()
        await createUser({ email: 'gone@deleted.local', username: 'gone' })
        const { cookie } = await createAuthenticatedUser('super_admin')

        const res = await app.request(
          '/admin/users',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(200)
        const body = await json(res)
        const byId = Object.fromEntries(
          body.map((u: { id: number }) => [u.id, u])
        )
        expect(byId[student.id]).toMatchObject({
          email: student.email,
          role: 'student',
          feedbackCount: 2,
          chatCount: 2,
          referralCount: 0
        })
        expect(byId[referrer.id]).toMatchObject({
          feedbackCount: 0,
          chatCount: 1,
          referralCount: 1
        })
        expect(
          body.some((u: { email: string }) =>
            u.email.endsWith('@deleted.local')
          )
        ).toBe(false)
      })
    })
  })

  describe('GET /admin/users/:id/chat-stats', () => {
    it("sums only that user's chats, deleted ones included", async () => {
      await withTestDb(async () => {
        const { student } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const res = await app.request(
          `/admin/users/${student.id}/chat-stats`,
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(200)
        const body = await json(res)
        expect(body).toMatchObject({
          chats: 2,
          deletedChats: 1,
          questions: 2,
          answers: 2,
          costMicros: 15000,
          helpful: 0,
          notHelpful: 1
        })
        expect(body.firstChatAt).not.toBeNull()
        expect(body.lastChatAt).not.toBeNull()

        const fresh = await createUser()
        const empty = await json(
          await app.request(
            `/admin/users/${fresh.id}/chat-stats`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(empty).toMatchObject({ chats: 0, costMicros: 0 })
        expect(empty.lastChatAt).toBeNull()

        const missing = await app.request(
          '/admin/users/999999/chat-stats',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(missing.status).toBe(404)
      })
    })
  })

  describe('GET /admin/users/:id/referrals', () => {
    it('lists referred accounts with their feedback counts', async () => {
      await withTestDb(async () => {
        const { student, referrer } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const detail = await json(
          await app.request(
            `/admin/users/${referrer.id}`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(detail.referralCount).toBe(1)

        const res = await app.request(
          `/admin/users/${referrer.id}/referrals`,
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(200)
        const body = await json(res)
        expect(body).toHaveLength(1)
        expect(body[0]).toMatchObject({
          id: student.id,
          email: student.email,
          username: 'alice',
          feedbackCount: 2,
          approvedFeedbackCount: 1
        })

        // The student referred nobody
        const none = await json(
          await app.request(
            `/admin/users/${student.id}/referrals`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(none).toEqual([])

        const missing = await app.request(
          '/admin/users/999999/referrals',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(missing.status).toBe(404)
      })
    })
  })

  describe('/admin/users/:id/journey', () => {
    it('adds, lists and removes declared degrees', async () => {
      await withTestDb(async () => {
        const { student, course } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')
        const headers = { Cookie: cookie, 'Content-Type': 'application/json' }
        const base = `/admin/users/${student.id}/journey`

        const added = await app.request(
          `${base}/degrees`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ degreeId: course.degreeId })
          },
          testEnv
        )
        expect(added.status).toBe(201)
        const { degree } = await json(added)
        expect(degree.degreeAcronym).toBe('LEIC-A')

        const duplicate = await app.request(
          `${base}/degrees`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ degreeId: course.degreeId })
          },
          testEnv
        )
        expect(duplicate.status).toBe(409)

        const listed = await json(await app.request(base, { headers }, testEnv))
        expect(listed.degrees).toHaveLength(1)
        const details = await json(
          await app.request(`/admin/users/${student.id}`, { headers }, testEnv)
        )
        expect(details.journeyDegreeCount).toBe(1)

        const removed = await app.request(
          `${base}/degrees/${degree.id}`,
          { method: 'DELETE', headers },
          testEnv
        )
        expect(removed.status).toBe(200)
        const after = await json(await app.request(base, { headers }, testEnv))
        expect(after.degrees).toHaveLength(0)
      })
    })

    it('edits the degree and years of an entry', async () => {
      await withTestDb(async () => {
        const { faculty, student, course } = await seed()
        const other = await createDegree(faculty.id, {
          acronym: 'MEIC-A',
          slug: 'meic-a'
        })
        const { cookie } = await createAuthenticatedUser('super_admin')
        const headers = { Cookie: cookie, 'Content-Type': 'application/json' }
        const base = `/admin/users/${student.id}/journey/degrees`

        const { degree } = await json(
          await app.request(
            base,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ degreeId: course.degreeId })
            },
            testEnv
          )
        )

        const updated = await app.request(
          `${base}/${degree.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              degreeId: other.id,
              startSchoolYear: 2022,
              endSchoolYear: 2023
            })
          },
          testEnv
        )
        expect(updated.status).toBe(200)
        const body = await json(updated)
        expect(body.degree.degreeAcronym).toBe('MEIC-A')
        expect(body.degree.startSchoolYear).toBe(2022)
        expect(body.degree.endSchoolYear).toBe(2023)

        const backwards = await app.request(
          `${base}/${degree.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              degreeId: other.id,
              startSchoolYear: 2023,
              endSchoolYear: 2022
            })
          },
          testEnv
        )
        expect(backwards.status).toBe(400)
      })
    })

    it("cannot remove another user's degree", async () => {
      await withTestDb(async () => {
        const { student, referrer, course } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')
        const headers = { Cookie: cookie, 'Content-Type': 'application/json' }

        const { degree } = await json(
          await app.request(
            `/admin/users/${referrer.id}/journey/degrees`,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ degreeId: course.degreeId })
            },
            testEnv
          )
        )
        const res = await app.request(
          `/admin/users/${student.id}/journey/degrees/${degree.id}`,
          { method: 'DELETE', headers },
          testEnv
        )
        expect(res.status).toBe(404)
      })
    })

    it('404s for a missing user', async () => {
      await withTestDb(async () => {
        const { cookie } = await createAuthenticatedUser('super_admin')
        const res = await app.request(
          '/admin/users/999999/journey',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(404)
      })
    })
  })

  describe('GET /admin/users/search', () => {
    it('matches email or username case-insensitively', async () => {
      await withTestDb(async () => {
        const { student, referrer } = await seed()
        await createUser({ email: 'gone@deleted.local', username: 'gone' })
        const { cookie } = await createAuthenticatedUser('super_admin')

        const get = async (q: string) =>
          (
            await app.request(
              `/admin/users/search?q=${encodeURIComponent(q)}`,
              { headers: { Cookie: cookie } },
              testEnv
            )
          ).json()

        const byEmail = await get('ALICE@')
        expect(byEmail.map((u: { id: number }) => u.id)).toEqual([student.id])
        expect(byEmail[0]).toEqual({
          id: student.id,
          email: student.email,
          username: 'alice'
        })

        const byName = await get('alic')
        expect(byName.map((u: { id: number }) => u.id)).toEqual([student.id])

        const tecnico = await get('tecnico')
        expect(tecnico.map((u: { id: number }) => u.id).sort()).toEqual(
          [student.id, referrer.id].sort()
        )

        // Anonymised accounts never show up, not even with an empty query
        const everyone = await get('')
        expect(
          everyone.some((u: { email: string }) =>
            u.email.endsWith('@deleted.local')
          )
        ).toBe(false)
      })
    })

    it('caps the result size', async () => {
      await withTestDb(async () => {
        for (let i = 0; i < 5; i++) {
          await createUser({ email: `bulk${i}@example.com` })
        }
        const { cookie } = await createAuthenticatedUser('super_admin')
        const res = await app.request(
          '/admin/users/search?q=bulk&limit=2',
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect((await res.json()).length).toBe(2)
      })
    })
  })

  describe('GET /admin/feedback?user_id=', () => {
    it('returns only account-linked rows for that user and exposes userId', async () => {
      await withTestDb(async () => {
        const { student, approved, pending, legacy } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const res = await app.request(
          `/admin/feedback?user_id=${student.id}`,
          { headers: { Cookie: cookie } },
          testEnv
        )
        expect(res.status).toBe(200)
        const body = await json(res)
        expect(body.total).toBe(2)
        const ids = body.data.map((f: { id: number }) => f.id).sort()
        expect(ids).toEqual([approved.id, pending.id].sort())
        expect(ids).not.toContain(legacy.id)
        expect(body.data[0].userId).toBe(student.id)
        expect(body.data[0].userEmail).toBe(student.email)

        // Unfiltered still includes the legacy row with a null userId
        const all = await json(
          await app.request(
            '/admin/feedback',
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(all.total).toBe(3)
        const legacyRow = all.data.find(
          (f: { id: number }) => f.id === legacy.id
        )
        expect(legacyRow.userId).toBeNull()
        expect(legacyRow.userEmail).toBeNull()
        expect(legacyRow.email).toBe(student.email)
      })
    })
  })

  describe('GET /admin/chats?user_id=', () => {
    it("returns only that user's chats, deleted ones included", async () => {
      await withTestDb(async () => {
        const { student, studentChat, deletedChat } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const body = await json(
          await app.request(
            `/admin/chats?user_id=${student.id}`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(body.total).toBe(2)
        const ids = body.data.map((c: { id: string }) => c.id).sort()
        expect(ids).toEqual([studentChat.publicId, deletedChat.publicId].sort())
        expect(body.data[0].userId).toBe(student.id)

        const all = await json(
          await app.request(
            '/admin/chats',
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(all.total).toBe(3)
      })
    })
  })

  describe('GET /admin/feedback/:id', () => {
    it('carries the linked account email and name, null for legacy rows', async () => {
      await withTestDb(async () => {
        const { student, approved, legacy } = await seed()
        const { cookie } = await createAuthenticatedUser('super_admin')

        const linked = await json(
          await app.request(
            `/admin/feedback/${approved.id}`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(linked.userId).toBe(student.id)
        expect(linked.userEmail).toBe(student.email)
        expect(linked.userName).toBe('alice')

        const old = await json(
          await app.request(
            `/admin/feedback/${legacy.id}`,
            { headers: { Cookie: cookie } },
            testEnv
          )
        )
        expect(old.userId).toBeNull()
        expect(old.userEmail).toBeNull()
        expect(old.email).toBe(student.email)
      })
    })
  })
})
