import { database, schema } from '@uni-feedback/db'
import { and, eq, gt } from 'drizzle-orm'

// Hash token using SHA-256 (same as API)
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)

  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getCurrentUserId(
  request: Request
): Promise<number | null> {
  try {
    const cookies = request.headers.get('Cookie') || ''
    const accessTokenMatch = cookies.match(/uni-feedback-auth-access=([^;]+)/)
    const accessToken = accessTokenMatch?.[1]

    if (!accessToken) return null

    const db = database()
    const accessTokenHash = await hashToken(accessToken)
    const [sessionData] = await db
      .select({ userId: schema.sessions.userId })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.accessTokenHash, accessTokenHash),
          gt(schema.sessions.expiresAt, new Date())
        )
      )
      .limit(1)

    return sessionData?.userId ?? null
  } catch {
    return null
  }
}
