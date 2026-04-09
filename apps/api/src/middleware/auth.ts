import { AUTH_CONFIG } from '@config/auth'
import { AuthService } from '@services/authService'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import {
  ForbiddenError,
  UnauthorizedError
} from '../routes/utils/errorHandling'

/**
 * Authenticates the user and returns an AuthenticatedRequestContext.
 * Throws UnauthorizedError if authentication fails.
 */
export async function requireAuth(
  c: Context
): Promise<AuthenticatedRequestContext> {
  const env = c.env as Env
  const context = (c.get('requestContext') as RequestContext) || {}
  const accessToken = getCookie(c, `${AUTH_CONFIG.COOKIE_NAME}-access`)

  if (!accessToken) {
    throw new UnauthorizedError('Authentication required')
  }

  // Verify session
  const authService = new AuthService(env)
  const sessionData = await authService.findSessionByAccessToken(accessToken)
  if (!sessionData) {
    throw new UnauthorizedError('Invalid or expired session')
  }

  // Add user to context
  const { user, ...session } = sessionData
  context.user = user
  context.session = { user, session }

  // Store updated context
  c.set('requestContext', context)

  return context as AuthenticatedRequestContext
}

/**
 * Authenticates the user and verifies admin role.
 * Throws UnauthorizedError if not authenticated, ForbiddenError if not admin.
 */
export async function requireAdmin(
  c: Context
): Promise<AuthenticatedRequestContext> {
  const authContext = await requireAuth(c)

  // Check if user has admin or super_admin role
  const user = authContext.user
  const isAdmin =
    user.role === 'admin' || user.role === 'super_admin' || user.superuser

  if (!isAdmin) {
    throw new ForbiddenError('Admin access required')
  }

  return authContext
}

/**
 * Authenticates the user and verifies superuser role.
 * Throws UnauthorizedError if not authenticated, ForbiddenError if not superuser.
 */
export async function requireSuperuser(
  c: Context
): Promise<AuthenticatedRequestContext> {
  const authContext = await requireAuth(c)

  // Check if user has super_admin role
  const user = authContext.user
  const isSuperuser = user.role === 'super_admin' || user.superuser

  if (!isSuperuser) {
    throw new ForbiddenError('Superuser access required')
  }

  return authContext
}
