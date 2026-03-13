import { TIME_MS } from '@uni-feedback/utils'
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Lightbulb
} from 'lucide-react'

export const ADD_COURSE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSd2FBk_hbv6v0iW-y8wtY6DL-fDIE_GlyA8rSkamSJJfCjCFQ/viewform?usp=header'

// Site URL for meta tags, sitemaps, and canonical URLs
export const SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL || 'https://uni-feedback.com'

// LocalStorage keys
export const STORAGE_KEYS = {
  SELECTED_FACULTY_ID: 'selectedFacultyId',
  SELECTED_DEGREE_ID: 'selectedDegreeId',
  FEEDBACK_EMAIL: 'lastFeedbackEmail',
  FEEDBACK_DEGREE_ID: 'lastFeedbackDegreeId',
  FEEDBACK_FACULTY_ID: 'lastFeedbackFacultyId',
  DEGREE_FILTERS: 'degreeFilters',
  COURSE_FILTERS: 'courseFilters',
  LAST_LOGIN_EMAIL: 'uni-feedback-last-email',
  AUTH_USER: 'uni-feedback-student-user',
  MAGIC_LINK_REQUEST_ID: 'uni-feedback-magic-link-request-id',
  MAGIC_LINK_RATE_LIMIT_RESET: 'uni-feedback-magic-link-rate-limit-reset',
  OTP_COOLDOWN_END: 'uni-feedback-otp-cooldown-end'
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
  {
    icon: GraduationCap,
    title: 'Teaching',
    description:
      'How the professor teaches. Were classes engaging? Easy to follow? Were they available outside class?'
  },
  {
    icon: ClipboardCheck,
    title: 'Assessment',
    description:
      'Exams, projects, grading. Was it fair? Clear? How hard was it really?'
  },
  {
    icon: BookOpen,
    title: 'Materials',
    description:
      'Slides, readings, platforms. Did they actually help you study or were they useless?'
  },
  {
    icon: Lightbulb,
    title: 'Tips',
    description:
      'The stuff no one tells you. Study hacks, mistakes to avoid, or what you wish you knew before enrolling.'
  }
] as const
