import { TIME_MS } from '@uni-feedback/utils'
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Lightbulb
} from 'lucide-react'

export const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform?usp=header'

// Social profiles — used across the footer, FAQ, and giveaway/Instagram surfaces
export const INSTAGRAM_URL = 'https://www.instagram.com/unifeedback/'
export const TIKTOK_URL = 'https://www.tiktok.com/@unifeedback'

// Summer 2026 giveaway deadline — July 31, 2026 23:59:59 Lisbon time
// (WEST / UTC+1 in summer). Powers the countdowns shown across the giveaway
// surfaces (hero, CTA, landing promo band, announcement banner).
export const GIVEAWAY_END_DATE = new Date('2026-07-31T23:59:59+01:00')

// A multi-day ticking countdown reads as "plenty of time" and kills urgency, so
// we show the plain end date until fewer than this many days remain, then flip
// to the live countdown for the final stretch (~72h), where the ticking clock
// actually feels imminent.
export const GIVEAWAY_COUNTDOWN_THRESHOLD_DAYS = 3

// Site URL for meta tags, sitemaps, and canonical URLs
export const SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:3000'

// LocalStorage keys
// Convention: All keys should be prefixed with 'uni-feedback-' for namespace isolation
export const STORAGE_KEYS = {
  // Course browser preferences (used in feedback flow)
  SELECTED_FACULTY_ID: 'uni-feedback-selected-faculty-id',
  SELECTED_DEGREE_ID: 'uni-feedback-selected-degree-id',

  // Legacy feedback keys (consider migrating to course browser keys)
  FEEDBACK_EMAIL: 'lastFeedbackEmail',
  FEEDBACK_DEGREE_ID: 'lastFeedbackDegreeId',
  FEEDBACK_FACULTY_ID: 'lastFeedbackFacultyId',

  // Filter state (contextual to specific pages)
  DEGREE_FILTERS: 'degreeFilters',
  COURSE_FILTERS: 'courseFilters',

  // Authentication
  LAST_LOGIN_EMAIL: 'uni-feedback-last-email',
  AUTH_USER: 'uni-feedback-student-user',
  MAGIC_LINK_REQUEST_ID: 'uni-feedback-magic-link-request-id',
  MAGIC_LINK_RATE_LIMIT_RESET: 'uni-feedback-magic-link-rate-limit-reset',
  OTP_COOLDOWN_END: 'uni-feedback-otp-cooldown-end',

  // Feedback form draft (global, not course-specific)
  FEEDBACK_DRAFT: 'uni-feedback-draft',

  // Profile page: last-opened tab (feedback | giveaway)
  PROFILE_ACTIVE_TAB: 'uni-feedback-profile-tab'
} as const

// OTP configuration (frontend constants)
export const OTP_CONFIG = {
  COOLDOWN_SECONDS: 60,
  CODE_LENGTH: 6
} as const

// Email verification configuration
export const VERIFICATION_CONFIG = {
  POLL_INTERVAL_MS: 2 * TIME_MS.SECOND, // Poll every 2 seconds
  MAX_POLL_DURATION_MS: 5 * TIME_MS.MINUTE, // 5 minutes timeout
  SUCCESS_DISPLAY_MS: 500, // Brief success display before auto-submit
  REQUEST_ID_FRESHNESS_MS: 5 * TIME_MS.MINUTE // RequestId expires after 5 minutes
} as const

// Feedback categories for scoring and guidance
export const FEEDBACK_CATEGORIES = [
  { key: 'teaching' as const, icon: GraduationCap },
  { key: 'assessment' as const, icon: ClipboardCheck },
  { key: 'materials' as const, icon: BookOpen },
  { key: 'tips' as const, icon: Lightbulb }
] as const

export type FeedbackCategoryKey = (typeof FEEDBACK_CATEGORIES)[number]['key']
