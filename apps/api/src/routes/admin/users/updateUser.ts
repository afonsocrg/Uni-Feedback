import { requireAdmin, requireSuperuser } from '@middleware'
import {
  AlreadyExistsError,
  BadRequestError,
  NotFoundError
} from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { detectChanges, notifyAdminChange } from '@utils/notificationHelpers'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, ne } from 'drizzle-orm'
import type { Context } from 'hono'
import { z } from 'zod'

const UserUpdateParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10))
})

const UserUpdateBodySchema = z.object({
  email: z.string().trim().email().optional(),
  username: z.string().trim().min(1).optional(),
  instagramHandle: z
    .string()
    .trim()
    .transform((val) => val.replace(/^@/, ''))
    .nullable()
    .optional(),
  // Changing a role is a privilege change, so it is superuser-only below.
  role: z.enum(['student', 'admin', 'super_admin']).optional()
})

const UserUpdateResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string(),
  role: z.enum(['student', 'admin', 'super_admin']),
  instagramHandle: z.string().nullable(),
  updatedAt: z.string(),
  message: z.string()
})

export class UpdateUser extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: 'Update user information',
    description:
      'Update the basic account fields of a user. Changing the role requires a superuser.',
    request: {
      params: UserUpdateParamsSchema,
      body: {
        content: {
          'application/json': {
            schema: UserUpdateBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'User updated successfully',
        content: {
          'application/json': {
            schema: UserUpdateResponseSchema
          }
        }
      },
      '400': {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      },
      '404': {
        description: 'User not found',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      },
      '409': {
        description: 'Email already in use by another account',
        content: {
          'application/json': {
            schema: z.object({ error: z.string() })
          }
        }
      }
    }
  }

  async handle(c: Context) {
    const env = c.env
    const authContext = await requireAdmin(c)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const { id: userId } = params
    const updates = body

    if (!userId || isNaN(userId)) {
      throw new BadRequestError('Invalid user ID')
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No update fields provided')
    }

    if (updates.role !== undefined) {
      await requireSuperuser(c)
      if (userId === authContext.user.id) {
        throw new BadRequestError('You cannot change your own role')
      }
    }

    const [existing] = await database()
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!existing) {
      throw new NotFoundError('User not found')
    }

    const updateData: Partial<typeof users.$inferInsert> = {}

    if (updates.email !== undefined) {
      const email = updates.email.toLowerCase()
      const [taken] = await database()
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), ne(users.id, userId)))
        .limit(1)
      if (taken) {
        throw new AlreadyExistsError('Another account already uses this email')
      }
      updateData.email = email
    }

    if (updates.username !== undefined) {
      updateData.username = updates.username
    }

    if (updates.instagramHandle !== undefined) {
      updateData.instagramHandle = updates.instagramHandle || null
    }

    if (updates.role !== undefined) {
      updateData.role = updates.role
      // Legacy flag kept in step with the role, same as requireSuperuser reads.
      updateData.superuser = updates.role === 'super_admin'
    }

    const originalData = {
      email: existing.email,
      username: existing.username,
      instagramHandle: existing.instagramHandle,
      role: existing.role
    }
    const changes = detectChanges(
      originalData,
      { ...originalData, ...updateData },
      ['email', 'username', 'instagramHandle', 'role']
    )

    const [updated] = await database()
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning()

    if (changes.length > 0) {
      await notifyAdminChange({
        env,
        user: authContext.user,
        resourceType: 'user',
        resourceId: userId,
        resourceName: existing.email,
        action: 'updated',
        changes
      })
    }

    return Response.json({
      id: updated.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      instagramHandle: updated.instagramHandle,
      updatedAt: updated.updatedAt?.toISOString() ?? '',
      message: 'User updated successfully'
    })
  }
}
