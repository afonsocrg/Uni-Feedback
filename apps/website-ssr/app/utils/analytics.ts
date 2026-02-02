import posthog from 'posthog-js'

/**
 * Core event tracking function
 * Safely captures events only in browser context when PostHog is loaded
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.capture(eventName, properties)
}

/**
 * Get a human-readable page name for a given pathname
 * Maps URL paths to analytics-friendly page names based on app routes
 *
 * @param path - The pathname to categorize (e.g., window.location.pathname)
 * @returns Page name for analytics tracking
 *
 * @example
 * getPageName('/') // 'home'
 * getPageName('/courses/123') // 'course_detail'
 * getPageName('/ist/leic') // 'degree_page'
 */
export const getPageName = (path: string): string => {
  // Exact matches first (most specific)
  if (path === '/') return 'home'
  if (path === '/browse') return 'browse'
  if (path === '/profile') return 'profile'
  if (path === '/giveaway') return 'giveaway'
  if (path === '/giveaway/rules') return 'giveaway_rules'
  if (path === '/points') return 'points'
  if (path === '/partners') return 'partners'
  if (path === '/terms') return 'terms'
  if (path === '/privacy') return 'privacy'
  if (path === '/guidelines') return 'guidelines'
  if (path === '/login') return 'login'

  // Dynamic routes (order matters - most specific first)
  if (path.startsWith('/courses/')) return 'course_detail'
  if (path.startsWith('/feedback/') && path.endsWith('/edit'))
    return 'feedback_edit'
  if (path === '/feedback/new') return 'feedback_form'

  // Faculty/Degree pages (/:facultySlug/:degreeSlug or /:facultySlug)
  // These are last because they're catch-all patterns
  const pathParts = path.split('/').filter(Boolean)
  if (pathParts.length === 2) return 'degree_page'
  if (pathParts.length === 1) return 'faculty_page'

  return 'other'
}

/**
 * Type-safe analytics tracking utilities
 * Organized by feature area for better maintainability
 */
export const analytics = {
  feedback: {
    /**
     * Track when feedback form page is loaded
     */
    formViewed: (props: { courseId?: number; isAuthenticated: boolean }) =>
      trackEvent('feedback_form_viewed', props),

    /**
     * Phase 2: Track form field interactions
     */
    facultySelected: (props: { facultyId: number; facultyName: string }) =>
      trackEvent('feedback_form_faculty_selected', props),

    degreeSelected: (props: {
      degreeId: number
      degreeName: string
      facultyId: number
    }) => trackEvent('feedback_form_degree_selected', props),

    courseSelected: (props: {
      courseId: number
      courseName: string
      degreeId: number
    }) => trackEvent('feedback_form_course_selected', props),

    ratingsEntered: (props: { rating: number; workloadRating: number }) =>
      trackEvent('feedback_form_ratings_entered', props),

    commentEntered: (props: { commentLength: number }) =>
      trackEvent('feedback_form_comment_entered', props),

    /**
     * Track when user clicks submit button (before auth check)
     */
    submitClicked: (props: {
      courseId: number
      formCompletionTime: number
      isAuthenticated: boolean
    }) => trackEvent('feedback_form_submit_clicked', props),

    /**
     * Track successful feedback submission
     */
    submitted: (props: {
      courseId: number
      hasComment: boolean
      commentLength?: number
      commentCategoriesCount?: number
    }) => trackEvent('feedback_submitted', props),

    /**
     * Track feedback submission failures
     */
    failed: (props: {
      courseId: number
      errorType: string
      errorMessage?: string
    }) => trackEvent('feedback_submission_failed', props),

    /**
     * Phase 3: Track feedback item views (intersection observer)
     */
    itemViewed: (props: { feedbackId: number; courseId: number }) =>
      trackEvent('feedback_item_viewed', props),

    /**
     * Phase 4: Track duplicate feedback updates
     */
    existingUpdated: (props: {
      feedbackId: number
      daysSinceOriginal: number
      ratingChanged: boolean
      commentChanged: boolean
    }) => trackEvent('existing_feedback_updated', props),

    /**
     * Track when duplicate feedback dialog is shown
     */
    duplicateShown: (props: { courseId: number; existingFeedbackId: number }) =>
      trackEvent('duplicate_feedback_shown', props)
  },

  auth: {
    /**
     * Track when auth dialog is shown to user
     */
    dialogShown: (props?: { trigger: string }) =>
      trackEvent('auth_dialog_shown', props),

    /**
     * Track when user enters email in auth flow
     */
    emailEntered: (props?: { emailDomain?: string }) =>
      trackEvent('auth_email_entered', props),

    /**
     * Track when OTP is successfully requested
     */
    otpRequested: () => trackEvent('auth_otp_requested'),

    /**
     * Track when user enters OTP code
     */
    otpEntered: () => trackEvent('auth_otp_entered'),

    /**
     * Track successful authentication completion
     */
    completed: (props?: { authMethod: string }) =>
      trackEvent('auth_completed', props),

    /**
     * Track authentication failures
     */
    failed: (props: { step: string; errorType: string }) =>
      trackEvent('auth_failed', props)
  },

  engagement: {
    /**
     * Track when user clicks upvote button
     */
    upvoteClicked: (props: { feedbackId: number; isAuthenticated: boolean }) =>
      trackEvent('feedback_upvote_clicked', props),

    /**
     * Track successful upvote completion
     */
    upvoteCompleted: (props: { feedbackId: number }) =>
      trackEvent('feedback_upvote_completed', props),

    /**
     * Track when report dialog is opened
     */
    reportOpened: (props: { feedbackId: number }) =>
      trackEvent('feedback_report_opened', props),

    /**
     * Track when report is submitted
     */
    reportSubmitted: (props: { feedbackId: number; reason: string }) =>
      trackEvent('feedback_report_submitted', props)
  },

  discovery: {
    /**
     * Phase 4: Track course discovery patterns
     */
    courseCardClicked: (props: {
      courseId: number
      sourcePage: string
      positionInList: number
    }) => trackEvent('course_card_clicked', props),

    searchPerformed: (props: { searchQuery: string; resultsCount: number }) =>
      trackEvent('course_search_performed', props),

    filterApplied: (props: { filterType: string; filterValue: string }) =>
      trackEvent('course_filter_applied', props)
  },

  navigation: {
    /**
     * Track when user clicks a link/button to navigate to feedback form
     * This fires BEFORE they reach the form page
     */
    feedbackFormLinkClicked: (props: {
      source: string
      referrerPage?: string
      courseId?: number
    }) => trackEvent('feedback_form_link_clicked', props)
  }
}

/**
 * Identify user in PostHog for user-level analytics
 * Call this after successful authentication
 */
export const identifyUser = (
  userId: string,
  traits?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.identify(userId, traits)
}

/**
 * Reset user identification (on logout)
 */
export const resetUser = () => {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.reset()
}
