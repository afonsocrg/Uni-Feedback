import { AUTH_CONFIG } from '@config/auth'
import { AuthService } from '@services/authService'
import {
  ForbiddenError,
  UnauthorizedError
} from '../routes/utils/errorHandling'

/**
 * Authenticates the user and returns an AuthenticatedRequestContext.
 * Throws UnauthorizedError if authentication fails.
 */
export async function requireAuth(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<AuthenticatedRequestContext> {
  // Get access token from cookie
  const cookies = request.headers.get('Cookie') || ''
  const accessTokenMatch = cookies.match(
    new RegExp(`${AUTH_CONFIG.COOKIE_NAME}-access=([^;]+)`)
  )
  const accessToken = accessTokenMatch?.[1]

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

  return context as AuthenticatedRequestContext
}

/**
 * Authenticates the user and verifies admin role.
 * Throws UnauthorizedError if not authenticated, ForbiddenError if not admin.
 */
export async function requireAdmin(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<AuthenticatedRequestContext> {
  const authContext = await requireAuth(request, env, context)

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
  request: Request,
  env: Env,
  context: RequestContext
): Promise<AuthenticatedRequestContext> {
  const authContext = await requireAuth(request, env, context)

  // Check if user has super_admin role
  const user = authContext.user
  const isSuperuser = user.role === 'super_admin' || user.superuser

  if (!isSuperuser) {
    throw new ForbiddenError('Superuser access required')
  }

  return authContext
}

// ============================================================================
// MIDDLEWARE WRAPPERS FOR ROUTER `before` HOOKS
// These return Response on error, undefined on success (for itty-router middleware)
// ============================================================================

/**
 * Middleware wrapper for requireAdmin.
 * Use this with router `before` hooks. Returns Response on error, undefined on success.
 */
export async function adminMiddleware(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<Response | undefined> {
  try {
    await requireAdmin(request, env, context)
    return undefined
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return Response.json({ error: error.message }, { status: 403 })
    }
    throw error
  }
}

/**
 * Middleware wrapper for requireSuperuser.
 * Use this with router `before` hooks. Returns Response on error, undefined on success.
 */
export async function superuserMiddleware(
  request: Request,
  env: Env,
  context: RequestContext
): Promise<Response | undefined> {
  try {
    await requireSuperuser(request, env, context)
    return undefined
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof ForbiddenError) {
      return Response.json({ error: error.message }, { status: 403 })
    }
    throw error
  }
}

// ============================================================================
// DEPRECATED: Old function names kept for backward compatibility
// ============================================================================

/**
 * @deprecated Use requireAuth instead
 */
export async function authenticateUser(
  request: Request,
  env: Env,
  context: RequestContext
) {
  try {
    await requireAuth(request, env, context)
    return undefined
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    throw error
  }
}
