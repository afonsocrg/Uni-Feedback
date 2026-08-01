import type { CorrectionRequestField } from '@uni-feedback/api-client'
import posthog from 'posthog-js'
import { detectLang, getLocalePath, isProfilePath } from '~/utils/i18n-routes'

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

export const getPageName = (path: string): string => {
  const lang = detectLang(path)

  // Static routes
  if (path === getLocalePath('home', lang)) return 'home'
  if (path === getLocalePath('browse', lang)) return 'browse'
  // Covers /perfil and its tab permalinks (/perfil/giveaway, /perfil/feedback).
  // Kept as one page name so existing referrerPage funnels stay comparable; the
  // tab itself is visible in $pathname on the pageview.
  if (isProfilePath(path, lang)) return 'profile'
  if (path === getLocalePath('giveaway', lang)) return 'giveaway'
  if (path === getLocalePath('giveaway-rules', lang)) return 'giveaway_rules'
  if (path === getLocalePath('giveaway-results', lang))
    return 'giveaway_results'
  if (path === getLocalePath('points', lang)) return 'points'
  if (path === getLocalePath('supporters', lang)) return 'supporters'
  if (path === getLocalePath('terms', lang)) return 'terms'
  if (path === getLocalePath('privacy', lang)) return 'privacy'
  if (path === getLocalePath('guidelines', lang)) return 'guidelines'
  if (path === getLocalePath('login', lang)) return 'login'
  if (path === getLocalePath('feedback-new', lang)) return 'feedback_form'

  // Dynamic routes
  const coursePrefix = lang === 'en' ? '/en/courses/' : '/cadeiras/'
  if (path.startsWith(coursePrefix)) return 'course_detail'

  const feedbackEditPattern =
    lang === 'en'
      ? /^\/en\/feedback\/[^/]+\/edit(\/.*)?$/
      : /^\/feedback\/[^/]+\/editar(\/.*)?$/
  if (feedbackEditPattern.test(path)) return 'feedback_edit'

  // Faculty/Degree pages — catch-all, must be last
  const pathWithoutLangPrefix = lang === 'en' ? path.slice('/en'.length) : path
  const pathParts = pathWithoutLangPrefix.split('/').filter(Boolean)
  if (pathParts.length === 2) return 'degree_page'
  if (pathParts.length === 1) return 'faculty_page'

  return 'other'
}

/**
 * Type-safe analytics tracking utilities
 * Organized by feature area for better maintainability
 */
export type FeedbackEntryPoint =
  | 'course_browser'
  | 'course_card'
  | 'course_reviews'
  | 'navbar'
  | 'footer'
  | 'nav_drawer'
  | 'profile'
  | 'points'
  | 'giveaway'
  | 'recommendations'
  | 'direct'

/**
 * Where a referral/invite share action was triggered from. Threaded through the
 * shared <ReferralShareButtons> so we can compare conversion by surface.
 */
export type ReferralSurface = 'feedback_success' | 'profile' | 'giveaway'

/**
 * The channel a share action went out through, for every share surface we have:
 * referral links, course pages, and review permalinks. The value doubles as the
 * `utm_medium` on the shared URL, so a landing can be joined back to its click.
 *
 * `referral_share_clicked` shipped `copy` here before this union was unified, so
 * that event's history splits on 2026-07-09: read it as `copy` OR `copy_url`.
 */
export type ShareChannel = 'whatsapp' | 'copy_url' | 'native'

/**
 * Where the correction/contribution dialog was opened from. `course_info_card`
 * is the generic "suggest a correction" action in the course header, which opens
 * with no field chosen; `content_section` is one of the description / assessment
 * / bibliography tabs, which opens with that field pre-filled.
 */
export type CorrectionEntryPoint = 'course_info_card' | 'content_section'

/**
 * A browse page that lists things behind a cards/list view toggle: the faculty
 * page lists degrees, the degree page lists courses. Threaded through the
 * shared <ViewModeToggle> so one event covers both, and each surface's switch
 * rate is `listing_view_mode_changed` over that page's own `*_page_viewed`.
 */
export type ListingSurface = 'faculty_page' | 'degree_page'

/** How a browse page lays its items out. Lives here, with `ListingSurface`, so
 *  the event vocabulary doesn't depend on a component. */
export type ViewMode = 'cards' | 'list'

/**
 * Which feedback form a field-level event came from. `<CommentSection>` is
 * shared between writing a new review and editing an existing one, and the two
 * are different funnels: the new-review comment is the step we're trying to
 * lift, the edit is maintenance.
 */
export type FeedbackFormSurface = 'new' | 'edit'

/**
 * Which card an action on an existing review was taken from. The same actions
 * (edit, open on the course page) live on both, and they mean different things:
 * the profile card is a student maintaining their reviews, the course page card
 * is one they stumbled back into while reading.
 */
export type FeedbackCardSurface = 'course_page' | 'profile'

/**
 * Where a course search was typed. All three surfaces search the same catalogue
 * but sit at opposite ends of the product: `degree_page` is a student browsing
 * courses to take, the other two are someone picking a course to review.
 */
export type SearchSurface =
  | 'degree_page'
  | 'feedback_course_browser'
  | 'change_course_dialog'

export const analytics = {
  feedback: {
    /**
     * Track when feedback form page is loaded
     */
    formViewed: (props: {
      courseId: number
      isAuthenticated: boolean
      entryPoint: FeedbackEntryPoint
    }) => trackEvent('feedback_form_viewed', props),

    /**
     * Track when course browser page is viewed
     */
    browserViewed: (props: {
      isAuthenticated: boolean
      hasPreselectedFilters: boolean
      fromSource?: string
    }) => trackEvent('feedback_browser_viewed', props),

    /**
     * Track when user changes course in the feedback form
     */
    courseChanged: (props: { fromCourseId: number; toCourseId: number }) =>
      trackEvent('feedback_course_changed', props),

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

    /**
     * Track when the user picks a school year from the chip selector.
     */
    schoolYearSelected: (props: { courseId: number; schoolYear: number }) =>
      trackEvent('feedback_form_school_year_selected', props),

    /**
     * Track when the user clicks through to the points page from the
     * "points you'll earn" helper on the feedback form.
     */
    pointsInfoClicked: (props: { courseId: number; points: number }) =>
      trackEvent('feedback_form_points_info_clicked', props),

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
      /** Year the student says they took the course. Only the current school
       *  year earns giveaway entries, so this is what the mislabelling
       *  monitoring reads. */
      schoolYear: number
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
     * Track when the post-submission success screen is shown. Anchors the
     * "what did the user do after submitting?" funnel (share / give another /
     * browse), which branches from here.
     */
    successViewed: (props: {
      courseId?: number
      hasRecommendations: boolean
      hasReferralCode: boolean
      referralBonusEarned: number
    }) => trackEvent('feedback_success_viewed', props),

    /**
     * Track clicks on the "you can edit this later in your profile" hint on the
     * success screen. Students were submitting and then assuming feedback was
     * final, so this measures whether the hint actually lands.
     */
    successEditHintClicked: (props: { courseId?: number }) =>
      trackEvent('feedback_success_edit_hint_clicked', props),

    /**
     * Phase 3: Track feedback item views (intersection observer)
     */
    itemViewed: (props: { feedbackId: number; courseId: number }) =>
      trackEvent('feedback_item_viewed', props),

    /**
     * Track when the author of a review clicks the edit pencil. `surface` says
     * which card it was: the profile is the maintenance path, the course page
     * is a student running into their own review in the wild. Together they
     * account for every entry into `feedback_edit`.
     */
    editClicked: (props: {
      feedbackId: number
      courseId: number
      surface: FeedbackCardSurface
    }) => trackEvent('feedback_edit_clicked', props),

    /**
     * Track when a student opens their own review on the course page from the
     * profile card. The link is a permalink to the comment, so this is the
     * "go look at it in context" intent, distinct from editing it.
     */
    viewOnCoursePageClicked: (props: {
      feedbackId: number
      courseId: number
    }) => trackEvent('feedback_view_on_course_page_clicked', props),

    /**
     * Track when a student opens the share popover on a review (intent). This
     * is the top of the review-share funnel: opened -> shareClicked -> the
     * shared link's landing, which arrives tagged `utm_source=feedback_permalink`.
     * A popover opened but never acted on is the abandonment case.
     */
    sharePopoverOpened: (props: { feedbackId: number; courseId: number }) =>
      trackEvent('feedback_share_popover_opened', props),

    /**
     * Track which share channel a student picked for a review permalink.
     */
    shareClicked: (props: {
      feedbackId: number
      courseId: number
      channel: ShareChannel
    }) => trackEvent('feedback_share_clicked', props),

    /**
     * Track a *successful* permalink copy (the clipboard write resolved).
     * Distinct from `shareClicked` because copy can silently fail.
     */
    linkCopied: (props: { feedbackId: number; courseId: number }) =>
      trackEvent('feedback_link_copied', props),

    /**
     * Track when a student expands/collapses the rating-only feedback of a
     * school year on the course page. Tells us whether students care about
     * feedback with no comment, now that it is hidden by default.
     */
    ratingsOnlyToggled: (props: {
      courseId: number
      schoolYear: number
      count: number
      expanded: boolean
    }) => trackEvent('feedback_ratings_only_toggled', props),

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
      trackEvent('duplicate_feedback_shown', props),

    /**
     * Track when course is selected from browser
     */
    courseSelectedFromBrowser: (props: { courseId: number }) =>
      trackEvent('course_selected_from_browser', props),

    /**
     * Track course search performed
     */
    courseSearchPerformed: (props: {
      query?: string
      facultyId?: number
      degreeId?: number
      resultsCount: number
    }) => trackEvent('course_search_performed', props)
  },

  referral: {
    /**
     * Track when a user clicks any referral share button (intent). `channel`
     * is which button; `surface` is where it lives. This is the top of the
     * referral funnel — the invited-friend signup is the conversion.
     */
    shareClicked: (props: {
      channel: ShareChannel
      surface: ReferralSurface
      giveawayActive: boolean
    }) => trackEvent('referral_share_clicked', props),

    /**
     * Track a *successful* referral-link copy (the clipboard write resolved).
     * Distinct from `shareClicked` because copy can silently fail.
     */
    linkCopied: (props: {
      surface: ReferralSurface
      giveawayActive: boolean
    }) => trackEvent('referral_link_copied', props)
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

  correction: {
    /**
     * Track a student landing on a content tab (description / assessment /
     * bibliography) that invites them to contribute. This is the denominator of
     * the contribution funnel: the CTA only renders inside the active tab, so a
     * view here means the student actually looked at that section.
     *
     * `hasExistingContent` splits the two intents the same dialog serves:
     * `false` is a gap we're asking students to fill, `true` is an edit of
     * information we already show.
     */
    contributePromptViewed: (props: {
      courseId: number
      field: CorrectionRequestField
      hasExistingContent: boolean
    }) => trackEvent('correction_contribute_prompt_viewed', props),

    /**
     * Track when a student opens the "suggest a correction" dialog from a
     * course page. Entry point of the course-data-quality funnel.
     *
     * `prefilledField` is set when the dialog was opened from a specific
     * section, so the student never had to pick a field.
     */
    dialogOpened: (props: {
      courseId: number
      entryPoint: CorrectionEntryPoint
      prefilledField?: CorrectionRequestField
      hasExistingContent?: boolean
    }) => trackEvent('correction_dialog_opened', props),

    /**
     * Track a correction request the API accepted. `field` is which piece of
     * course data was reported as wrong; the free-text notes are never sent.
     */
    submitted: (props: {
      courseId: number
      field: CorrectionRequestField
      entryPoint: CorrectionEntryPoint
      hasExistingContent: boolean
    }) => trackEvent('correction_submitted', props),

    /**
     * Track a correction request the API rejected. Distinct from `submitted`
     * so a broken endpoint doesn't just look like a drop in submissions.
     */
    submissionFailed: (props: {
      courseId: number
      field: CorrectionRequestField
      entryPoint: CorrectionEntryPoint
      errorType: string
    }) => trackEvent('correction_submission_failed', props),

    /**
     * Track abandonment: the dialog closed without a successful submission.
     * `fieldSelected` / `hasNotes` show how far the user got before leaving.
     */
    dialogDismissed: (props: {
      courseId: number
      entryPoint: CorrectionEntryPoint
      fieldSelected: boolean
      hasNotes: boolean
    }) => trackEvent('correction_dialog_dismissed', props)
  },

  discovery: {
    /**
     * Track a load of the faculty picker (`/explorar`). The true top of the
     * browse funnel, one step above `faculty_page_viewed`, and the denominator
     * for everything else on that page: the search and the university chips
     * only fire on interaction, so no rate means anything without this.
     *
     * `facultyCount` is what makes the filtering question answerable at all.
     * The search and the chips were added because the list got long; if they
     * stay unused while the count climbs, the list isn't the friction.
     */
    browsePageViewed: (props: {
      facultyCount: number
      universityCount: number
    }) => trackEvent('browse_page_viewed', props),

    /**
     * Track a university chip on the faculty picker being selected or cleared.
     * `universitySlug` is null on clear, which is the signal that the filter
     * hid what the student was looking for.
     */
    browseUniversityFilterApplied: (props: {
      universitySlug: string | null
      resultsCount: number
    }) => trackEvent('browse_university_filter_applied', props),

    /**
     * Track a search on the faculty picker once the query settles (debounced).
     * Separate from `course_search_performed`: this searches faculties, not the
     * course catalogue, and a `resultsCount` of 0 here means a student looking
     * for a school we don't cover yet, which is a coverage signal rather than a
     * search-quality one.
     */
    browseSearchPerformed: (props: {
      searchQuery: string
      resultsCount: number
    }) => trackEvent('browse_faculty_search_performed', props),

    /**
     * Track a faculty card opened from the picker. The conversion step of the
     * browse page, and what says whether search and chips actually shorten the
     * path: `positionInList` next to `hasSearchQuery` / `hasUniversityFilter`
     * shows whether a student narrowed the list before picking or just scanned.
     */
    browseFacultySelected: (props: {
      facultySlug: string
      universitySlug: string | null
      positionInList: number
      hasSearchQuery: boolean
      hasUniversityFilter: boolean
    }) => trackEvent('browse_faculty_selected', props),

    /**
     * Track a faculty page load. Entry point of the browse funnel and the
     * denominator for that page's view mode switch rate.
     *
     * `degreeCount` is the cards-vs-list signal here, and it swings hard: IST
     * lists 80 degrees while FDUL lists 1, so the list's density only means
     * anything at the top of that range.
     */
    facultyPageViewed: (props: {
      facultySlug: string
      degreeCount: number
      defaultViewMode: ViewMode
    }) => trackEvent('faculty_page_viewed', props),

    /**
     * Track a degree page load. Entry point of the course-discovery funnel and
     * the denominator for everything else on the page: `viewModeChanged`,
     * `filterApplied` and `searchPerformed` all fire only on interaction, so a
     * rate is meaningless without this.
     *
     * `courseCount` is what makes the cards-vs-list question answerable: the
     * list only earns its density on long degrees, so switch rate cut by how
     * many courses a student is actually facing is the interesting signal.
     */
    degreePageViewed: (props: {
      facultySlug: string
      degreeSlug: string
      courseCount: number
      defaultViewMode: ViewMode
    }) => trackEvent('degree_page_viewed', props),

    /**
     * Phase 4: Track course discovery patterns
     */
    courseCardClicked: (props: {
      courseId: number
      sourcePage: string
      positionInList: number
    }) => trackEvent('course_card_clicked', props),

    /**
     * Track a course search once the query settles (debounced). `surface`
     * separates a student browsing courses to take (`degree_page`) from someone
     * searching for a course to review (`feedback_course_browser`); the two are
     * different intents on the same catalogue. `resultsCount` is what surfaces
     * dead-end searches (a query that returns nothing), a concrete friction
     * point on the path from consuming to contributing.
     */
    searchPerformed: (props: {
      searchQuery: string
      resultsCount: number
      surface: SearchSurface
    }) => trackEvent('course_search_performed', props),

    filterApplied: (props: { filterType: string; filterValue: string }) =>
      trackEvent('course_filter_applied', props),

    /**
     * Track when a student switches a browse page between the card grid and the
     * compact list. `surface` says which page; both listings render the same
     * items from the same filters, so this is purely about layout.
     *
     * Only fires on an actual switch, never on load: a student who keeps the
     * default emits nothing, so any rate needs that surface's `*_page_viewed`
     * as the denominator. `defaultViewMode` records what they were switching
     * *away from*, so the event stays readable if we ever flip the default.
     */
    viewModeChanged: (props: {
      viewMode: ViewMode
      surface: ListingSurface
      defaultViewMode: ViewMode
    }) => trackEvent('listing_view_mode_changed', props)
  },

  course: {
    /**
     * Track when a student shares a course page from the course header.
     *
     * The `course_id` / `course_acronym` property names are snake_case, unlike
     * the camelCase used elsewhere, because this event predates the typed
     * abstraction and its properties are already queried in PostHog.
     */
    shareClicked: (props: {
      medium: ShareChannel
      course_id: number
      course_acronym: string
    }) => trackEvent('share_course', props),

    /**
     * Track when a student asks a friend to review a course they haven't
     * reviewed. Same snake_case caveat as `shareClicked` above.
     */
    feedbackRequested: (props: {
      medium: ShareChannel
      course_id: number
      course_acronym: string
    }) => trackEvent('request_feedback', props)
  },

  giveaway: {
    /**
     * Track a load of the public giveaway results page. Entry event of the
     * "see what we built -> write a review" funnel and the denominator for the
     * clicks below, which only fire on interaction.
     *
     * The counts ride along because the page is live: a spike in views is only
     * readable next to what the page actually said at the time.
     * `giveawayActive` separates the two lives of this page, campaign snapshot
     * and permanent recap, which convert very differently.
     */
    resultsViewed: (props: {
      giveawayActive: boolean
      reviews: number
      contributors: number
      degreesListed: number
    }) => trackEvent('giveaway_results_viewed', props),

    /**
     * Track a click through from a degree row to that degree's page.
     * `position` is the row's place in the list, which is what says whether
     * students come for the biggest degrees or to find their own further down.
     */
    resultsDegreeClicked: (props: { degreeId: number; position: number }) =>
      trackEvent('giveaway_results_degree_clicked', props),

    /**
     * Track expanding the degree list past the first five rows. Fires on expand
     * only, never on collapse, so the rate against `giveaway_results_viewed`
     * reads directly as "how many people wanted to see further down".
     */
    resultsDegreesExpanded: (props: { totalDegrees: number }) =>
      trackEvent('giveaway_results_degrees_expanded', props),

    /**
     * Track the breadcrumb back to the campaign page. The results link is
     * shared on its own, so this measures how many visitors arrive with no idea
     * what the giveaway is and go looking for it.
     */
    resultsBreadcrumbClicked: (props: { referrerPage?: string }) =>
      trackEvent('giveaway_results_breadcrumb_clicked', props),

    /**
     * Track the entry into the results page from the campaign landing page.
     * `source` says which of the landing page's entry points did the work.
     */
    resultsLinkClicked: (props: { source: string; referrerPage?: string }) =>
      trackEvent('giveaway_results_link_clicked', props)
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
