import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { and, asc, notIlike, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const SearchUsersQuerySchema = z.object({
  // An empty `?q=` arrives as null, not '', so accept both and treat as "all"
  q: z.string().trim().nullable().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const n = parseInt(val || '20', 10)
      return isNaN(n) ? 20 : Math.min(Math.max(n, 1), 50)
    })
})

const UserSearchResultSchema = z.object({
  id: z.number(),
  email: z.string(),
  username: z.string()
})

/**
 * Admin-level user lookup for pickers (the feedback list's author filter).
 * The full list in GetUsers is superuser-only; this one returns at most 50
 * matches by email or username, which is what a picker needs.
 */
export class SearchUsers extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: 'Search users by email or username',
    description:
      'Returns a short list of accounts matching the query, for author pickers. Deleted accounts are excluded.',
    request: {
      query: SearchUsersQuerySchema
    },
    responses: {
      '200': {
        description: 'Matching users',
        content: {
          'application/json': {
            schema: z.array(UserSearchResultSchema)
          }
        }
      }
    }
  }

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const { q, limit } = query

    const conditions = [notIlike(users.email, '%@deleted.local')]
    if (q) {
      const pattern = `%${q.toLowerCase()}%`
      conditions.push(
        or(
          sql`LOWER(${users.email}) LIKE ${pattern}`,
          sql`LOWER(${users.username}) LIKE ${pattern}`
        )!
      )
    }

    const rows = await database()
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(and(...conditions))
      .orderBy(asc(users.email))
      .limit(limit)

    return Response.json(rows)
  }
}
