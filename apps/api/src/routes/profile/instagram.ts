import { requireAuth } from '@middleware'
import { BadRequestError } from '@routes/utils/errorHandling'
import { PointService } from '@services/pointService'
import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { normalizeInstagramHandle } from '@uni-feedback/utils'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  role: z.string(),
  referralCode: z.string().nullable(),
  instagramHandle: z.string().nullable()
})

export class SetInstagramHandle extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Set or update the current user Instagram handle',
    description:
      'Links an Instagram handle to the profile and awards a one-time bonus the first time a handle is linked.',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              handle: z.string()
            })
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Instagram handle updated successfully',
        content: {
          'application/json': {
            schema: z.object({ user: userResponseSchema })
          }
        }
      },
      '400': {
        description: 'Invalid Instagram handle',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      },
      '401': {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    const env = c.env as Env
    const authContext = await requireAuth(c)
    const userId = authContext.user.id

    const data = await this.getValidatedData<typeof this.schema>()
    const handle = normalizeInstagramHandle(data.body.handle)
    if (!handle) {
      throw new BadRequestError('Invalid Instagram handle')
    }

    await database()
      .update(users)
      .set({ instagramHandle: handle })
      .where(eq(users.id, userId))

    // Idempotent: only awards the bonus the first time a handle is linked.
    const pointService = new PointService(env)
    await pointService.awardInstagramBonus(userId)

    return Response.json({
      user: {
        id: authContext.user.id,
        email: authContext.user.email,
        username: authContext.user.username,
        role: authContext.user.role,
        referralCode: authContext.user.referralCode,
        instagramHandle: handle
      }
    })
  }
}

export class DeleteInstagramHandle extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Remove the current user Instagram handle',
    description:
      'Unlinks the Instagram handle from the profile and removes the linking bonus.',
    responses: {
      '200': {
        description: 'Instagram handle removed successfully',
        content: {
          'application/json': {
            schema: z.object({ message: z.string() })
          }
        }
      },
      '401': {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    const env = c.env as Env
    const authContext = await requireAuth(c)
    const userId = authContext.user.id

    await database()
      .update(users)
      .set({ instagramHandle: null })
      .where(eq(users.id, userId))

    const pointService = new PointService(env)
    await pointService.removeInstagramBonus(userId)

    return Response.json({
      message: 'Instagram handle removed successfully'
    })
  }
}
