import { AUTH_CONFIG, TOKEN_EXPIRATION_S } from '@config/auth'
import type { Session } from '@uni-feedback/db/schema'
import { createCookie } from '@uni-feedback/utils'

// Type for sessions that include the plain tokens (as returned by AuthService)
type SessionWithTokens = Session & { accessToken: string; refreshToken: string }

/**
 * Adds authentication cookies to a Response
 * Mutates the response by adding Set-Cookie headers
 */
export function setAuthCookies(response: Response, session: SessionWithTokens): void {
  // Set access token cookie (sent to all API endpoints)
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-access`, session.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: TOKEN_EXPIRATION_S.ACCESS_TOKEN
    })
  )

  // Set refresh token cookie (only sent to refresh endpoint)
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-refresh`, session.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/auth/refresh',
      maxAge: TOKEN_EXPIRATION_S.REFRESH_TOKEN
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
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 0
    })
  )

  // Clear refresh token cookie
  response.headers.append(
    'Set-Cookie',
    createCookie(`${AUTH_CONFIG.COOKIE_NAME}-refresh`, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/auth/refresh',
      maxAge: 0
    })
  )
}
