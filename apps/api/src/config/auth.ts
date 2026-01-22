import { TIME_MS, TIME_S } from '@uni-feedback/utils'

// Token expiration configuration
export const TOKEN_EXPIRATION_MS = {
  ACCESS_TOKEN: 15 * TIME_MS.MINUTE, // 15 minutes
  REFRESH_TOKEN_ADMIN: 30 * TIME_MS.DAY, // 30 days for admins
  REFRESH_TOKEN_STUDENT: 60 * TIME_MS.DAY, // 60 days for students
  PASSWORD_RESET: 24 * TIME_MS.HOUR, // 24 hours
  USER_CREATION: 7 * TIME_MS.DAY, // 7 days
  MAGIC_LINK: 15 * TIME_MS.MINUTE // 15 minutes for magic links
} as const

// Token expiration in seconds (for cookies)
export const TOKEN_EXPIRATION_S = {
  ACCESS_TOKEN: 15 * TIME_S.MINUTE, // 15 minutes
  REFRESH_TOKEN_ADMIN: 30 * TIME_S.DAY, // 30 days for admins
  REFRESH_TOKEN_STUDENT: 60 * TIME_S.DAY, // 60 days for students
  PASSWORD_RESET: 24 * TIME_S.HOUR, // 24 hours
  USER_CREATION: 7 * TIME_S.DAY, // 7 days
  MAGIC_LINK: 15 * TIME_S.MINUTE // 15 minutes for magic links
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

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  MAGIC_LINK: {
    MAX_REQUESTS: 3, // Maximum requests per window
    WINDOW_MINUTES: 5 // Time window in minutes
  }
} as const

// OTP configuration
export const OTP_CONFIG = {
  CODE_LENGTH: 6,
  EXPIRATION_MS: 20 * TIME_MS.MINUTE,
  RATE_LIMIT_SECONDS: 60,
  MAX_ATTEMPTS: 5
} as const

// Magic link configuration
export const MAGIC_LINK_CONFIG = {
  // Request ID reuse window
  // When requesting a new magic link, reuse the requestId from recent requests
  // This allows cross-device verification (mobile polling → desktop verification)
  REQUEST_ID_REUSE_WINDOW_MS: 15 * TIME_MS.MINUTE,

  // Verification idempotency window
  // RequestId can be verified multiple times within this window after first verification
  // This prevents race conditions when multiple devices poll for the same requestId
  VERIFICATION_IDEMPOTENCY_WINDOW_MS: 30 * TIME_MS.SECOND,

  // Expired token requestId exposure window
  // Only return requestId from expired tokens if they were created within this window
  // This prevents exposing requestIds from very old expired tokens
  EXPIRED_TOKEN_REQUESTID_WINDOW_MS: 2 * TIME_MS.HOUR,

  // Token usage freshness window for verification
  // When verifying via requestId, the token must have been used within this window
  // This prevents verifying tokens that were used a long time ago
  TOKEN_USAGE_FRESHNESS_WINDOW_MS: 5 * TIME_MS.MINUTE
} as const
