import { AUTH_CONFIG, TOKEN_EXPIRATION_S } from '@config/auth'
import type { Session } from '@uni-feedback/db/schema'
import { createCookie } from '@uni-feedback/utils'

// Type for sessions that include the plain tokens (as returned by AuthService)
type SessionWithTokens = Session & { accessToken: string; refreshToken: string }

// SameSite=None;Secure is needed in dev to support cross-origin requests (e.g. tunnels for mobile testing)
const isProd = process.env.NODE_ENV === 'production'
const cookieDefaults = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'Strict' : 'None') as 'Strict' | 'None'
}

/**
 * Adds authentication cookies to a Response
 * Mutates the response by adding Set-Cookie headers
 *
 * @param response - Response object to add cookies to
 * @param session - Session with tokens
 */
export function setAuthCookies(
  response: Response,
  session: SessionWithTokens
): void {
  // Set access token cookie (sent to all API endpoints)
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-access`, session.accessToken, {
      ...cookieDefaults,
      path: '/',
      maxAge: TOKEN_EXPIRATION_S.ACCESS_TOKEN
    })
  )

  // Set refresh token cookie (only sent to refresh endpoint)
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-refresh`, session.refreshToken, {
      ...cookieDefaults,
      path: '/auth/refresh',
      maxAge: TOKEN_EXPIRATION_S.REFRESH_TOKEN_STUDENT
    })
  )
}

/**
 * Clears authentication cookies from a Response
 * Mutates the response by adding Set-Cookie headers with expired cookies
 */
export function clearAuthCookies(response: Response): void {
  // Clear access token cookie
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-access`, '', {
      ...cookieDefaults,
      path: '/',
      maxAge: 0
    })
  )

  // Clear refresh token cookie
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-refresh`, '', {
      ...cookieDefaults,
      path: '/auth/refresh',
      maxAge: 0
    })
  )
}
