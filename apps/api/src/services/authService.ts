import { RATE_LIMIT_CONFIG, TOKEN_EXPIRATION_MS } from '@config/auth'
import { InternalServerError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import {
  magicLinkRateLimits,
  magicLinkTokens,
  passwordResetTokens,
  sessions,
  userCreationTokens,
  users,
  type MagicLinkToken,
  type NewUser,
  type PasswordResetToken,
  type Session,
  type User,
  type UserCreationToken
} from '@uni-feedback/db/schema'
import {
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyHash
} from '@utils/auth'
import { and, eq, gt, isNotNull, isNull, lt } from 'drizzle-orm'
import { sendNewSignupNotification } from './telegram'

export class AuthService {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }
  /**
   * Create a new user
   */
  async createUser(
    userData: Omit<
      NewUser,
      'id' | 'createdAt' | 'updatedAt' | 'passwordHash'
    > & { password: string }
  ): Promise<User> {
    const passwordHash = await hashPassword(userData.password)

    const [user] = await database()
      .insert(users)
      .values({
        ...userData,
        passwordHash
      })
      .returning()

    return user
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const [user] = await database()
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return user || null
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number): Promise<User | null> {
    const [user] = await database()
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return user || null
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.findUserByEmail(email)
    if (!user) return null
    if (!user.passwordHash) return null

    const isValid = await verifyHash(password, user.passwordHash)
    return isValid ? user : null
  }

  /**
   * Create a new session with role-based expiry
   */
  async createSession(
    userId: number,
    userRole: 'student' | 'admin' | 'super_admin' = 'admin'
  ): Promise<Session & { accessToken: string; refreshToken: string }> {
    // Clean up expired sessions for this user
    await this.cleanupExpiredSessions(userId)

    const accessToken = generateSecureToken(32)
    const refreshToken = generateSecureToken(48)
    const accessTokenHash = await hashToken(accessToken)
    const refreshTokenHash = await hashToken(refreshToken)

    // Role-based refresh token expiry
    const refreshExpiry =
      userRole === 'student'
        ? TOKEN_EXPIRATION_MS.REFRESH_TOKEN_STUDENT
        : TOKEN_EXPIRATION_MS.REFRESH_TOKEN_ADMIN

    const expiresAt = new Date(Date.now() + refreshExpiry)

    const [session] = await database()
      .insert(sessions)
      .values({
        userId,
        accessTokenHash,
        refreshTokenHash,
        expiresAt
      })
      .returning()

    return {
      ...session,
      accessToken,
      refreshToken
    }
  }

  /**
   * Find session by access token
   */
  async findSessionByAccessToken(
    accessToken: string
  ): Promise<(Session & { user: User }) | null> {
    const accessTokenHash = await hashToken(accessToken)

    const result = await database()
      .select({
        session: sessions,
        user: users
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.accessTokenHash, accessTokenHash),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1)

    if (result.length === 0) return null

    return {
      ...result[0].session,
      user: result[0].user
    }
  }

  /**
   * Find session by refresh token
   */
  async findSessionByRefreshToken(
    refreshToken: string
  ): Promise<(Session & { user: User }) | null> {
    const refreshTokenHash = await hashToken(refreshToken)

    const result = await database()
      .select({
        session: sessions,
        user: users
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1)

    if (result.length === 0) return null

    return {
      ...result[0].session,
      user: result[0].user
    }
  }

  /**
   * Refresh a session
   */
  async refreshSession(
    refreshToken: string
  ): Promise<(Session & { accessToken: string; refreshToken: string }) | null> {
    const sessionData = await this.findSessionByRefreshToken(refreshToken)
    if (!sessionData) return null

    // Update the session with new tokens and expiry
    const newAccessToken = generateSecureToken(32)
    const newRefreshToken = generateSecureToken(48)
    const newAccessTokenHash = await hashToken(newAccessToken)
    const newRefreshTokenHash = await hashToken(newRefreshToken)
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS.ACCESS_TOKEN)

    const [updatedSession] = await database()
      .update(sessions)
      .set({
        accessTokenHash: newAccessTokenHash,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: newExpiresAt
      })
      .where(eq(sessions.id, sessionData.id))
      .returning()

    return {
      ...updatedSession,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(accessToken: string): Promise<void> {
    const accessTokenHash = await hashToken(accessToken)
    await database()
      .delete(sessions)
      .where(eq(sessions.accessTokenHash, accessTokenHash))
  }

  /**
   * Clean up expired sessions for a user
   */
  async cleanupExpiredSessions(userId: number): Promise<void> {
    await database()
      .delete(sessions)
      .where(
        and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date()))
      )
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(
    userId: number
  ): Promise<PasswordResetToken & { token: string }> {
    const token = generateSecureToken(32)
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS.PASSWORD_RESET)

    const [resetToken] = await database()
      .insert(passwordResetTokens)
      .values({
        userId,
        tokenHash,
        expiresAt
      })
      .returning()

    return {
      ...resetToken,
      token
    }
  }

  /**
   * Find valid password reset token
   */
  async findPasswordResetToken(
    token: string
  ): Promise<(PasswordResetToken & { user: User }) | null> {
    const tokenHash = await hashToken(token)

    const result = await database()
      .select({
        token: passwordResetTokens,
        user: users
      })
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1)

    if (result.length === 0) return null

    return {
      ...result[0].token,
      user: result[0].user
    }
  }

  /**
   * Use password reset token
   */
  async usePasswordResetToken(
    token: string,
    newPassword: string
  ): Promise<boolean> {
    const tokenData = await this.findPasswordResetToken(token)
    if (!tokenData) return false

    const passwordHash = await hashPassword(newPassword)

    // Update user password and mark token as used in a transaction
    await database().transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenData.userId))

      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenData.id))
    })

    return true
  }

  /**
   * Create user creation token
   */
  async createUserCreationToken(
    email: string,
    createdBy: number
  ): Promise<UserCreationToken & { token: string }> {
    const token = generateSecureToken(32)
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS.USER_CREATION)

    const [creationToken] = await database()
      .insert(userCreationTokens)
      .values({
        email,
        tokenHash,
        expiresAt,
        createdBy
      })
      .returning()

    return {
      ...creationToken,
      token
    }
  }

  /**
   * Find valid user creation token
   */
  async findUserCreationToken(
    token: string
  ): Promise<UserCreationToken | null> {
    const tokenHash = await hashToken(token)

    const [creationToken] = await database()
      .select()
      .from(userCreationTokens)
      .where(
        and(
          eq(userCreationTokens.tokenHash, tokenHash),
          gt(userCreationTokens.expiresAt, new Date()),
          isNull(userCreationTokens.usedAt)
        )
      )
      .limit(1)

    return creationToken || null
  }

  /**
   * Use user creation token
   */
  async useUserCreationToken(
    token: string,
    userData: { username: string; password: string }
  ): Promise<User | null> {
    const tokenData = await this.findUserCreationToken(token)
    if (!tokenData) return null

    const passwordHash = await hashPassword(userData.password)

    // Create user and mark token as used in a transaction
    const newUser = await database().transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: tokenData.email,
          username: userData.username,
          passwordHash,
          superuser: false
        })
        .returning()

      await tx
        .update(userCreationTokens)
        .set({ usedAt: new Date() })
        .where(eq(userCreationTokens.id, tokenData.id))

      return user
    })

    return newUser || null
  }

  /**
   * Get all users (for admin)
   */
  async getAllUsers(): Promise<User[]> {
    return await database().select().from(users).orderBy(users.createdAt)
  }

  /**
   * Delete user and all related data
   */
  async deleteUser(userId: number): Promise<void> {
    // Foreign key constraints will handle cascading deletes
    await database().delete(users).where(eq(users.id, userId))
  }

  /**
   * Create magic link token for email
   */
  async createMagicLinkToken(
    email: string,
    enablePolling: boolean = false
  ): Promise<MagicLinkToken & { token: string; requestId: string | null }> {
    const token = generateSecureToken(32)
    const tokenHash = await hashToken(token)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS.MAGIC_LINK)
    const requestId = enablePolling ? generateSecureToken(32) : null

    const [magicToken] = await database()
      .insert(magicLinkTokens)
      .values({
        email: email.toLowerCase(),
        tokenHash,
        requestId,
        expiresAt
      })
      .returning()

    return {
      ...magicToken,
      token
    }
  }

  /**
   * Find valid magic link token
   */
  async findMagicLinkToken(token: string): Promise<MagicLinkToken | null> {
    const tokenHash = await hashToken(token)

    const [magicToken] = await database()
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.tokenHash, tokenHash),
          gt(magicLinkTokens.expiresAt, new Date()),
          isNull(magicLinkTokens.usedAt)
        )
      )
      .limit(1)

    return magicToken || null
  }

  /**
   * Use magic link token - creates user if doesn't exist, returns session
   */
  async useMagicLinkToken(
    token: string
  ): Promise<
    (Session & { accessToken: string; refreshToken: string; user: User }) | null
  > {
    const tokenData = await this.findMagicLinkToken(token)
    if (!tokenData) return null

    // Find or create user
    let user = await this.findUserByEmail(tokenData.email)

    if (!user) {
      // Auto-create student user on first sign-in
      const username = tokenData.email.split('@')[0] // Use email prefix as username
      const [newUser] = await database()
        .insert(users)
        .values({
          email: tokenData.email,
          username,
          passwordHash: null, // Students have no password
          role: 'student',
          superuser: false
        })
        .returning()
      user = newUser

      sendNewSignupNotification(this.env, user.email)
    }

    // Create session and mark token as used in transaction
    const result = await database().transaction(async (tx) => {
      const session = await this.createSession(user!.id, user!.role)

      await tx
        .update(magicLinkTokens)
        .set({ usedAt: new Date() })
        .where(eq(magicLinkTokens.id, tokenData.id))

      return { ...session, user: user! }
    })

    return result
  }

  /**
   * Verify a magic link via requestId (polling endpoint)
   * If magic link has been used (email clicked) but not verified, creates session
   * Returns null for all non-success cases to prevent timing attacks
   */
  async verifyMagicLinkByRequestId(requestId: string): Promise<
    | (Session & {
        accessToken: string
        refreshToken: string
        user: User
      })
    | null
  > {
    const [tokenData] = await database()
      .select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.requestId, requestId),
          gt(magicLinkTokens.expiresAt, new Date()),
          isNotNull(magicLinkTokens.usedAt),
          isNull(magicLinkTokens.verifiedAt)
        )
      )
      .limit(1)

    // Return null for: invalid requestId, not clicked yet, already consumed, or expired
    if (!tokenData) {
      return null
    }

    // Find or create user
    let user = await this.findUserByEmail(tokenData.email)

    if (!user) {
      throw new InternalServerError(
        'User should exist when verifying magic link by requestId'
      )
    }

    // Create session and mark as verified via polling
    const result = await database().transaction(async (tx) => {
      const session = await this.createSession(user.id, user.role)

      await tx
        .update(magicLinkTokens)
        .set({ verifiedAt: new Date() })
        .where(eq(magicLinkTokens.id, tokenData.id))

      return { ...session, user }
    })

    return result
  }

  /**
   * Check and update rate limit for email
   * Returns true if request is allowed, false if rate limited
   */
  async checkMagicLinkRateLimit(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase()
    const now = new Date()
    const windowStart = new Date(
      now.getTime() - RATE_LIMIT_CONFIG.MAGIC_LINK.WINDOW_MINUTES * 60 * 1000
    )

    // Get or create rate limit record
    const [rateLimitRecord] = await database()
      .select()
      .from(magicLinkRateLimits)
      .where(eq(magicLinkRateLimits.email, normalizedEmail))
      .limit(1)

    if (!rateLimitRecord) {
      // First request - create record
      await database().insert(magicLinkRateLimits).values({
        email: normalizedEmail,
        requestCount: 1,
        windowStart: now
      })
      return true
    }

    // Check if window has expired
    if (rateLimitRecord.windowStart < windowStart) {
      // Reset window
      await database()
        .update(magicLinkRateLimits)
        .set({
          requestCount: 1,
          windowStart: now
        })
        .where(eq(magicLinkRateLimits.email, normalizedEmail))
      return true
    }

    // Check if under limit
    if (
      rateLimitRecord.requestCount < RATE_LIMIT_CONFIG.MAGIC_LINK.MAX_REQUESTS
    ) {
      // Increment count
      await database()
        .update(magicLinkRateLimits)
        .set({
          requestCount: rateLimitRecord.requestCount + 1
        })
        .where(eq(magicLinkRateLimits.email, normalizedEmail))
      return true
    }

    // Rate limited
    return false
  }
}
