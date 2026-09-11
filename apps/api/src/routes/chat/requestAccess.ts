import { getAuthContext } from '@middleware'
import { sendChatAccessRequestNotification } from '@services'
import { database } from '@uni-feedback/db'
import { chatAccessRequests, faculties } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, inArray } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'
import { checkIpRateLimit } from './access'

/**
 * Someone asking to be let in who cannot sign up.
 *
 * **Deliberately unauthenticated.** Login requires a university email, so
 * applicants, high-school students and anyone outside the whitelist cannot have
 * an account at all. Putting the one door aimed at them behind auth would make
 * it unreachable by exactly the people it is for. A session is attached when
 * there is one, so a logged-in student using the same form is still linked.
 *
 * **Why the question is stored.** Someone without an account has no `chats`
 * row, so the question they typed exists only in their browser until this row is
 * written. These are also the only questions in the whole system that do not
 * come from an enrolled student, which makes them the single window into
 * non-student demand until the identity rework lands.
 *
 * Plan: afonsocrg/prds/2026-08-09_ai_chat.md, "The access request form".
 */
export class RequestChatAccess extends OpenAPIRoute {
  schema = {
    tags: ['Chat'],
    summary: 'Ask to be told when the chat opens up',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              email: z.string().email().max(255),
              /** Faculty ids they picked from the list we show. */
              facultyIds: z.array(z.number().int()).max(50).optional(),
              /** Universities we do not list yet, typed free-form. */
              otherUniversities: z.string().max(500).optional(),
              /**
               * Who they are, as several answers rather than one. The form is a
               * multi-select because the options sit on different axes: being at
               * university and wanting a master's elsewhere are both true of the
               * same person, and the pair is the interesting part.
               */
              roles: z
                .array(
                  z.enum([
                    'high_school',
                    'bachelor',
                    'masters',
                    'finished',
                    'applying',
                    'want_masters',
                    'changing_university',
                    'university_not_listed',
                    'studying_abroad',
                    'other'
                  ])
                )
                .max(10)
                .optional(),
              locale: z.string().max(10).optional(),
              /** The question they typed, when they arrived from one. */
              question: z.string().max(2000).optional(),
              source: z.string().max(50).optional()
            })
          }
        }
      }
    },
    responses: {
      '200': { description: 'Request recorded' },
      '429': { description: 'Too many requests from this address' }
    }
  }

  async handle(c: Context) {
    // No account to attach a quota to, so the IP limiter is the only ceiling
    // this endpoint has.
    checkIpRateLimit(c)

    const { body } = await this.getValidatedData<typeof this.schema>()
    const authContext = await getAuthContext(c)

    const env = c.env as Env
    const email = body.email.trim().toLowerCase()

    // Asked before? Told apart from a first-time request only so the Telegram
    // ping can say so. The earlier row is never touched: overwriting it would
    // drop whatever they said the first time, and what someone asked twice is
    // itself the signal we want.
    const [previousRequest] = await database()
      .select({ id: chatAccessRequests.id })
      .from(chatAccessRequests)
      .where(eq(chatAccessRequests.email, email))
      .limit(1)

    const isRepeat = Boolean(previousRequest)

    // Always a new row, never an update. These are submissions, not a profile:
    // a second one is a person telling us more, and folding it into the first
    // would silently lose the first answer. Counting people waiting is a
    // `count(DISTINCT email)` away, which is the cheaper side of the trade.
    await database()
      .insert(chatAccessRequests)
      .values({
        userId: authContext?.user.id ?? null,
        email,
        source: body.source ?? null,
        responses: {
          facultyIds: body.facultyIds,
          otherUniversities: body.otherUniversities,
          roles: body.roles,
          locale: body.locale,
          question: body.question
        }
      })

    // The row is the record; the ping is so someone reads it the same day.
    // Best-effort on purpose: a Telegram outage must not lose the request.
    try {
      const facultyIds = body.facultyIds ?? []
      const pickedFaculties = facultyIds.length
        ? await database()
            .select({ shortName: faculties.shortName })
            .from(faculties)
            .where(inArray(faculties.id, facultyIds))
        : []

      await sendChatAccessRequestNotification(env, {
        email,
        source: body.source,
        faculties: pickedFaculties.map((faculty) => faculty.shortName),
        otherUniversities: body.otherUniversities,
        roles: body.roles,
        locale: body.locale,
        question: body.question,
        userId: authContext?.user.id ?? null,
        isRepeat
      })
    } catch (notifyError) {
      console.error(
        'Failed to send chat access request notification:',
        notifyError
      )
    }

    return c.json({ success: true })
  }
}
