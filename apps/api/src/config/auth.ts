import { TIME_MS, TIME_S } from '@uni-feedback/utils'

// Token expiration configuration
export const TOKEN_EXPIRATION_MS = {
  ACCESS_TOKEN: 15 * TIME_MS.MINUTE, // 15 minutes
  REFRESH_TOKEN: 30 * TIME_MS.DAY, // 30 days
  PASSWORD_RESET: 24 * TIME_MS.HOUR, // 24 hours
  USER_CREATION: 7 * TIME_MS.DAY // 7 days
} as const

// Token expiration in seconds (for cookies)
export const TOKEN_EXPIRATION_S = {
  ACCESS_TOKEN: 15 * TIME_S.MINUTE, // 15 minutes
  REFRESH_TOKEN: 30 * TIME_S.DAY, // 30 days
  PASSWORD_RESET: 24 * TIME_S.HOUR, // 24 hours
  USER_CREATION: 7 * TIME_S.DAY // 7 days
} as const

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,
  REQUIRE_UPPERCASE: true
} as const

// Password validation regex
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/

// Auth configuration
export const AUTH_CONFIG = {
  COOKIE_NAME: 'uni-feedback-auth',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    path: '/'
  },
  MAX_SESSIONS_PER_USER: null // Unlimited sessions as per spec
} as const
