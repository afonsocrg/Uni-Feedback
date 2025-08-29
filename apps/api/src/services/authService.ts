import { TOKEN_EXPIRATION_MS } from '@config/auth'
import {
  getDb,
  passwordResetTokens,
  sessions,
  userCreationTokens,
  users,
  type NewUser,
  type PasswordResetToken,
  type Session,
  type User,
  type UserCreationToken
} from '@uni-feedback/database'
import {
  generateSecureToken,
  hashPassword,
  hashToken,
  verifyHash
} from '@utils/auth'
import { and, eq, gt, isNull, lt } from 'drizzle-orm'

export class AuthService {
  private env: Env
  private db: ReturnType<typeof getDb>

  constructor(env: Env) {
    this.env = env
    this.db = getDb(env)
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

    const [user] = await this.db
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
    const [user] = await this.db
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
    const [user] = await this.db
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

    const isValid = await verifyHash(password, user.passwordHash)
    return isValid ? user : null
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: number
  ): Promise<Session & { accessToken: string; refreshToken: string }> {
    // Clean up expired sessions for this user
    await this.cleanupExpiredSessions(userId)

    const accessToken = generateSecureToken(32)
    const refreshToken = generateSecureToken(48)
    const accessTokenHash = await hashToken(accessToken)
    const refreshTokenHash = await hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS.ACCESS_TOKEN)

    const [session] = await this.db
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

    const result = await this.db
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

    const result = await this.db
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

    const [updatedSession] = await this.db
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
    await this.db
      .delete(sessions)
      .where(eq(sessions.accessTokenHash, accessTokenHash))
  }

  /**
   * Clean up expired sessions for a user
   */
  async cleanupExpiredSessions(userId: number): Promise<void> {
    await this.db
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

    const [resetToken] = await this.db
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

    const result = await this.db
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

    // Update user password and mark token as used
    await this.db.batch([
      this.db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenData.userId)),
      this.db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, tokenData.id))
    ])

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

    const [creationToken] = await this.db
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

    const [creationToken] = await this.db
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

    // Create user and mark token as used
    const result = await this.db.batch([
      this.db
        .insert(users)
        .values({
          email: tokenData.email,
          username: userData.username,
          passwordHash,
          superuser: false
        })
        .returning(),
      this.db
        .update(userCreationTokens)
        .set({ usedAt: new Date() })
        .where(eq(userCreationTokens.id, tokenData.id))
    ])

    return result[0][0] || null
  }

  /**
   * Get all users (for admin)
   */
  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(users.createdAt)
  }

  /**
   * Delete user and all related data
   */
  async deleteUser(userId: number): Promise<void> {
    // Foreign key constraints will handle cascading deletes
    await this.db.delete(users).where(eq(users.id, userId))
  }
}
