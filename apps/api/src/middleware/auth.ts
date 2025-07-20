import { AuthService } from '@services/authService'
import { AUTH_CONFIG } from '@config/auth'

export async function authenticateUser(
  request: Request,
  env: any,
  context: any
) {
  // Get access token from cookie
  const cookies = request.headers.get('Cookie') || ''
  const accessTokenMatch = cookies.match(
    new RegExp(`${AUTH_CONFIG.COOKIE_NAME}-access=([^;]+)`)
  )
  const accessToken = accessTokenMatch?.[1]

  if (!accessToken) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Verify session
  const authService = new AuthService(env)
  const sessionData = await authService.findSessionByAccessToken(accessToken)
  if (!sessionData) {
    return Response.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    )
  }

  // Add user to context
  context.user = sessionData.user
  context.session = sessionData
}

export async function requireSuperuser(
  request: Request,
  env: any,
  context: any
) {
  // First authenticate
  const authResult = await authenticateUser(request, env, context)
  if (authResult) return authResult

  // Check if user is superuser
  if (!context.user?.superuser) {
    return Response.json(
      { error: 'Superuser access required' },
      { status: 403 }
    )
  }
}
