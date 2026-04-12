import { AUTH_CONFIG } from '@config/auth'
import { AuthService } from '@services/authService'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import {
  ForbiddenError,
  UnauthorizedError
} from '../routes/utils/errorHandling'

/**
 * Resolves the authenticated user from the request context or session cookie.
 * Returns null if no valid session is found — never throws.
 */
export async function getAuthContext(
  c: Context
): Promise<AuthenticatedRequestContext | null> {
  const context = (c.get('requestContext') as RequestContext) || {}

  // Short-circuit if already authenticated (e.g. by upstream middleware)
  if (context.user && context.session) {
    return context as AuthenticatedRequestContext
  }

  const env = c.env as Env
  const accessToken = getCookie(c, `${AUTH_CONFIG.COOKIE_NAME}-access`)

  if (!accessToken) {
    return null
  }

  // Verify session
  const authService = new AuthService(env)
  const sessionData = await authService.findSessionByAccessToken(accessToken)
  if (!sessionData) {
    return null
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
 * Requires the user to be authenticated.
 * Throws UnauthorizedError if no valid session is found.
 */
export async function requireAuth(
  c: Context
): Promise<AuthenticatedRequestContext> {
  const context = await getAuthContext(c)
  if (!context) {
    throw new UnauthorizedError('Authentication required')
  }
  return context
}

/**
 * Requires the user to be authenticated and have admin role.
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
 * Requires the user to be authenticated and have superuser role.
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
