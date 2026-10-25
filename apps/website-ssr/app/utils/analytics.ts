import type {
  CorrectionRequestField,
  ReportCategory
} from '@uni-feedback/api-client'
import type { ToolbarFormat } from '@uni-feedback/ui'
import posthog from 'posthog-js'
import type { Lang } from '~/i18n/config'
import type { CrumbLevel } from '~/utils/breadcrumbs'
import { detectLang, getLocalePath, isProfilePath } from '~/utils/i18n-routes'
import type { ThemePreference } from '~/utils/theme'

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
  // Covers /perfil and its tab permalinks (/perfil/percurso, /perfil/feedback).
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
  // University pages (/unis, /unis/:uniSlug and its sub-pages)
  if (pathParts[0] === 'unis') {
    return pathParts.length === 1 ? 'universities' : 'university_page'
  }
  if (pathParts.length === 2) return 'degree_page'
  if (pathParts.length === 1) return 'faculty_page'

  return 'other'
}

/**
 * Type-safe analytics tracking utilities
 * Organized by feature area for better maintainability
 */
/**
 * Every `?from=` value an in-app link into the feedback flow may carry. The one
 * list: the type derives from it, the path builders in `i18n-routes` only accept
 * its values, and the form validates against it. So a link tagged with anything
 * else fails type-check instead of silently landing in PostHog as `direct`.
 */
export const FEEDBACK_LINK_SOURCES = [
  'course_browser',
  'course_list',
  'course_reviews',
  'navbar',
  'footer',
  'nav_drawer',
  'profile',
  'points',
  'giveaway',
  'giveaway_results',
  'recommendations',
  'chat_gap'
] as const

export type FeedbackLinkSource = (typeof FEEDBACK_LINK_SOURCES)[number]

/** `direct` is any arrival without a recognised `?from=`. */
export type FeedbackEntryPoint = FeedbackLinkSource | 'direct'

export function toFeedbackEntryPoint(from: string | null): FeedbackEntryPoint {
  return FEEDBACK_LINK_SOURCES.find((source) => source === from) ?? 'direct'
}

/**
 * Where a referral/invite share action was triggered from. Threaded through the
 * shared <ReferralShareButtons> so we can compare conversion by surface.
 */
export type ReferralSurface = 'feedback_success' | 'profile' | 'giveaway'

/** Where a student edited "O meu percurso" from. */
export type JourneySurface = 'profile' | 'chat'

/**
 * What the degree form was opened for. `inferred` is editing the guess before
 * accepting it, which saves as a new degree.
 */
export type JourneyFormMode = 'add' | 'edit' | 'inferred'

/** What the chat's degree prompt was offering: confirm a guess, or ask. */
export type JourneyChatPromptState = 'inferred' | 'empty'

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
/**
 * Where a "spotted a mistake?" mailto link was clicked. `degree_about` sits
 * under our degree description, `degree_admission` / `degree_outcomes` under the
 * official data on the degree page; `*_page` is the foot of the page.
 */
export type ErrorReportSurface =
  | 'degree_about'
  | 'degree_admission'
  | 'degree_outcomes'
  | 'degree_page'
  | 'degree_courses_page'
  | 'degree_admission_page'
  | 'degree_careers_page'
  | 'faculty_page'
  | 'faculty_type_page'
  | 'university_page'

/**
 * A fact the degree page expected and does not have, next to its "Sabes isto?
 * Ajuda-nos a completar" prompt.
 */
export type MissingInfoField =
  | 'teaching_language'
  | 'schedule'
  | 'campus'
  | 'admission'
  | 'fees'
  | 'outcomes'
  | 'requirements'
  | 'application_dates'
  | 'careers'

/**
 * A faculty page: the hub (`/ist`) or one of its type pages (`/ist/licenciaturas`
 * is `bachelor`).
 */
export type FacultyPageKind =
  | 'hub'
  | 'bachelor'
  | 'integrated_master'
  | 'master'
  | 'minor'
  | 'postgraduate'
  | 'phd'

/** Where a link on the faculty pages points to */
export type FacultyLinkTarget =
  | 'degree'
  | 'degree_admission'
  | 'type_page'
  | 'faculty'
  | 'university'
  | 'course'
  | 'campus_map'
  | 'campus_website'
  /** The website and official profiles in the header (OfficialLinks) */
  | 'official_site'
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'

/** University pages (/unis/:uniSlug and its sub-pages) */
export type UniversityPageKind =
  | 'main'
  | 'faculties'
  | 'bachelors'
  /** `/cursos` and the type pages (`/mestrados`, ...), told apart by `degreeType` */
  | 'degrees'

/** Where a link on the university pages points to */
export type UniversityLinkTarget =
  | 'university'
  | 'faculty'
  | 'faculty_type_page'
  | 'degree'
  | 'course'
  | 'faculties_page'
  | 'bachelors_page'
  /** `/unis/:uniSlug/cursos` */
  | 'degrees_page'
  /** A university type page (`/unis/:uniSlug/mestrados`, ...) */
  | 'university_type_page'
  | 'official_site'
  /** "A tua universidade não está aqui?" mailto on /unis */
  | 'missing_university'
  /** "Abrir no Google Maps" in a campus map popup */
  | 'campus_map'
  /** "Site oficial" in a campus map popup */
  | 'campus_website'
  /** An official profile in the header (OfficialLinks) */
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'

/** The sections of the degree page (v2), in page order. Also the anchor ids. */
export type DegreeSectionId =
  | 'sobre'
  | 'plano'
  | 'ingresso'
  | 'depois'
  | 'destaques'
  | 'campus'
  | 'faq'
  | 'relacionados'

/** The course page's sections, by anchor, in page order (since 2026-10-25) */
export type CourseSectionId =
  | 'feedback'
  | 'sobre'
  | 'avaliacao'
  | 'bibliografia'

/** Outside pages the degree page links to as the source of what it shows. */
export type DegreeSourceLink =
  | 'dges'
  | 'infocursos'
  | 'fees'
  | 'campus_map'
  | 'campus_website'

export type CorrectionEntryPoint =
  | 'course_info_card'
  | 'content_section'
  /** Deep-linked from a chat answer that reported the field as missing. This is
   *  how we measure whether the chat feeds contributions back into the site. */
  | 'chat_answer'

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
  /**
   * The degree page's course search: the full listing until 2026-10-22, then
   * the plan summary's search box (back on 2026-10-23, every year at once)
   */
  | 'degree_page'
  /** A degree's course browser, `/:faculty/:degree/cadeiras` */
  | 'degree_courses_page'
  | 'feedback_course_browser'
  | 'change_course_dialog'
  | 'landing_hero'

/**
 * The landing page's sections, in no particular order (the page order travels
 * as `position` on `landing_section_viewed`, so reordering the page does not
 * rename anything here).
 */
export type LandingSection =
  | 'hero'
  | 'ask_chat'
  | 'supporters'
  | 'live_feed'
  | 'giveaway_promo'
  | 'contribute_strip'
  | 'trust'
  | 'browse'
  | 'more_than_your_network'
  | 'founder'
  | 'testimonials'
  | 'contribute_cta'
  | 'faq'
  | 'final_cta'

/** What a hero search click opened. `browse_all` is the dropdown's footer link,
 *  `enter` is pressing Enter in the box (which also opens the browse page). */
export type LandingSearchResultType =
  | 'course'
  | 'degree'
  | 'faculty'
  | 'browse_all'
  | 'enter'

/**
 * Which piece of site chrome a navigation or preference action came from. The
 * same links and controls now appear in all three, so without this the navbar
 * redesign is unmeasurable: we cannot tell whether moving an item into the
 * drawer or the footer cost it its clicks.
 */
export type NavSurface = 'navbar' | 'mobile_menu' | 'footer' | 'chat_sidebar'

/** The page a breadcrumb sits on */
export type BreadcrumbSurface =
  | 'universities'
  | 'university'
  | 'university_subpage'
  | 'faculty'
  | 'faculty_type'
  | 'faculty_legacy'
  | 'degree'
  | 'degree_courses'
  | 'degree_subpage'
  | 'course'

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
     * Track when a formatting control is used in the comment editor. `source`
     * separates the always-visible toolbar from the selection bubble menu, so
     * we can tell whether making the toolbar visible actually got students
     * formatting (the reason it was added) or just added chrome.
     */
    commentFormatted: (props: {
      format: ToolbarFormat
      source: 'toolbar' | 'bubble'
      surface: FeedbackFormSurface
    }) => trackEvent('feedback_form_comment_formatted', props),

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
      errorType: 'validation' | 'api_error' | 'network'
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
     * The sign-in funnel.
     *
     * Every step carries `trigger`, which is what makes conversion answerable
     * per surface: "of the people the chat asked to sign in, how many finished,
     * and how many of those were new accounts". Without it these events are one
     * undifferentiated pile and the chat's acquisition claim cannot be checked.
     */
    dialogShown: (props?: { trigger: string }) =>
      trackEvent('auth_dialog_shown', props),

    emailEntered: (props?: { emailDomain?: string; trigger?: string }) =>
      trackEvent('auth_email_entered', props),

    otpRequested: (props?: { trigger?: string }) =>
      trackEvent('auth_otp_requested', props),

    otpEntered: (props?: { trigger?: string }) =>
      trackEvent('auth_otp_entered', props),

    /**
     * `isNewUser` separates acquisition from re-authentication. A chat that only
     * makes existing students log in is not growing the list, however good its
     * conversion rate looks.
     */
    completed: (props?: {
      authMethod: 'otp'
      trigger?: string
      isNewUser?: boolean
    }) => trackEvent('auth_completed', props),

    failed: (props: {
      step: 'otp_request' | 'otp_verification'
      errorType: 'api_error' | 'network' | 'invalid_code'
      trigger?: string
    }) => trackEvent('auth_failed', props),

    /**
     * They typed an address from a university we do not cover.
     *
     * High signal and otherwise invisible: it is demand from someone we cannot
     * serve, and the domain says which institution to look at next.
     */
    unsupportedDomain: (props: { emailDomain: string; trigger?: string }) =>
      trackEvent('auth_unsupported_domain_entered', props),

    /**
     * They closed the dialog without signing in.
     *
     * Before this, leaving was only the absence of `auth_email_entered`.
     * `stage` says whether they left before typing ('input') or after a
     * failure ('error'). The dialog cannot be closed from the code step.
     */
    dialogClosed: (props: { trigger: string; stage: 'input' | 'error' }) =>
      trackEvent('auth_dialog_closed', props)
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
    reportSubmitted: (props: { feedbackId: number; reason: ReportCategory }) =>
      trackEvent('feedback_report_submitted', props)
  },

  correction: {
    /**
     * Track a content section (description / assessment / bibliography) that
     * invites the student to contribute coming into view. This is the
     * denominator of the contribution funnel. Until 2026-10-25 these were tabs
     * and it fired when the student opened one; since then they are sections
     * of one page and it fires when one scrolls into view, once per page view.
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
      errorType: 'api_error'
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
    }) => trackEvent('correction_dialog_dismissed', props),

    /**
     * Track a click on a "spotted a mistake? let us know" mailto link on a
     * degree or faculty page. Only intent: whether the email is sent is
     * invisible to us. Clicks over page views decide whether it becomes an
     * in-page form.
     */
    errorReportClicked: (props: {
      surface: ErrorReportSurface
      facultySlug: string | null
      degreeSlug: string | null
    }) => trackEvent('error_report_clicked', props),

    /**
     * Track a click on "Sabes isto? Ajuda-nos a completar" next to a fact the
     * degree page has no value for (a mailto, like `error_report_clicked`).
     * Only intent. `field` says which gaps students can actually fill.
     */
    missingInfoClicked: (props: {
      field: MissingInfoField
      facultySlug: string | null
      degreeSlug: string | null
    }) => trackEvent('missing_info_clicked', props)
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
     *
     * `restoredUniversitySlug` is the university the page came up already
     * filtered to, from a previous visit's choice, and null when the student
     * sees the full list. It lives here rather than firing a
     * `browse_university_filter_applied` on load, so that event keeps meaning
     * "a student touched a chip". Watch it against
     * `browse_university_filter_applied{universitySlug: null}`: a restore that
     * is routinely cleared on arrival is a filter we should not have persisted.
     */
    browsePageViewed: (props: {
      facultyCount: number
      universityCount: number
      restoredUniversitySlug: string | null
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
     * Track a faculty page load. Entry point of the browse funnel.
     *
     * `degreeCount` swings hard (IST lists 80 degrees while FDUL lists 1), so
     * cut anything on this page by it.
     */
    facultyPageViewed: (props: { facultySlug: string; degreeCount: number }) =>
      trackEvent('faculty_page_viewed', props),

    /**
     * Track a degree page load. Entry point of the course-discovery funnel and
     * the denominator for everything else on the page: `filterApplied` and
     * `searchPerformed` fire only on interaction, so a rate is meaningless
     * without this.
     */
    degreePageViewed: (props: {
      facultySlug: string
      degreeSlug: string
      courseCount: number
      /** Discontinued courses, in the collapsed section (not in courseCount) */
      pastCourseCount: number
      /** The sections this page rendered (v2), so reach can be read per section */
      sections: DegreeSectionId[]
    }) => trackEvent('degree_page_viewed', props),

    /**
     * Track a degree page section scrolled into view, once per section per page
     * view. Over `degree_page_viewed{sections contains X}` it is the reach of
     * each section: whether anyone gets past the course plan.
     */
    degreeSectionViewed: (props: {
      facultySlug: string
      degreeSlug: string
      section: DegreeSectionId
    }) => trackEvent('degree_section_viewed', props),

    /**
     * Track a jump through the degree page's table of contents (`sidebar` on
     * desktop, `mobile_sheet` on phones).
     */
    degreeTocClicked: (props: {
      facultySlug: string
      degreeSlug: string
      section: DegreeSectionId
      surface: 'sidebar' | 'mobile_sheet'
    }) => trackEvent('degree_toc_clicked', props),

    /**
     * Track a click from the degree page to its course browser (`/cadeiras`):
     * "Explorar todas as cadeiras" under the plan summary (`plan_section`),
     * or the header's "Ver as N cadeiras" (`header`, removed 2026-10-25: the
     * plan summary sits right below it). Over
     * `degree_page_viewed` it says how many come to the degree page to find a
     * course rather than to learn about the degree.
     */
    degreeCoursesCtaClicked: (props: {
      facultySlug: string
      degreeSlug: string
      /**
       * `plan_optional`: the plan summary's "N optativas" link for a year.
       * `plan_more`: the "see N more courses" link under a term cut down to
       * its most reviewed courses (until 2026-10-24, one "the other N courses"
       * link under the whole year).
       */
      surface: 'header' | 'plan_section' | 'plan_optional' | 'plan_more'
      curriculumYear?: number
    }) => trackEvent('degree_courses_cta_clicked', props),

    /** Track a curriculum year chip in the degree page's plan summary. */
    degreePlanYearSelected: (props: {
      facultySlug: string
      degreeSlug: string
      curriculumYear: number
    }) => trackEvent('degree_plan_year_selected', props),

    /**
     * Track a load of a degree's course browser (`/:faculty/:degree/cadeiras`).
     * Entry point of the course-discovery funnel since 2026-10-22, when the
     * listing moved off the degree page: the denominator for
     * `course_search_performed{surface: 'degree_courses_page'}`,
     * `course_filter_applied` and `course_card_clicked` there.
     * */
    degreeCoursesPageViewed: (props: {
      facultySlug: string
      degreeSlug: string
      courseCount: number
      pastCourseCount: number
    }) => trackEvent('degree_courses_page_viewed', props),

    /**
     * Track a load of a degree sub-page: `admission` (`/ingresso`) or
     * `careers` (`/saidas-profissionais`), prds/content_rich_pages.md decision
     * 22. `hasData` is false when the page only shows "we don't have this yet"
     * prompts (a master's with no InfoCursos data, say).
     */
    degreeSubpageViewed: (props: {
      facultySlug: string
      degreeSlug: string
      page: 'admission' | 'careers'
      hasData: boolean
    }) => trackEvent('degree_subpage_viewed', props),

    /**
     * Track a click into a degree sub-page from the summary section on the
     * degree page ("Ver tudo sobre o ingresso"). The tabs across the degree's
     * pages (`subnav`) were removed 2026-10-23.
     */
    degreeSubpageLinkClicked: (props: {
      facultySlug: string
      degreeSlug: string
      page: 'overview' | 'courses' | 'admission' | 'careers'
      surface: 'section'
    }) => trackEvent('degree_subpage_link_clicked', props),

    /** Track the mobile "Nesta página" sheet being opened. */
    degreeTocOpened: (props: { facultySlug: string; degreeSlug: string }) =>
      trackEvent('degree_toc_opened', props),

    /** Track "Mostrar mais / menos" on the degree description. */
    degreeAboutToggled: (props: {
      facultySlug: string
      degreeSlug: string
      expanded: boolean
    }) => trackEvent('degree_about_toggled', props),

    /** Track a click out to a source (DGES, InfoCursos, fee page, map, campus site). */
    /**
     * A campus picked on a campus map (`components/common/campusMap`): in the
     * list beside it, or by clicking its pin. `page` is where the map is;
     * slugs say whose page it is.
     */
    campusSelected: (props: {
      page: 'university' | 'faculty' | 'degree'
      universitySlug?: string
      facultySlug: string
      degreeSlug?: string
      campus: string
      surface: 'list' | 'pin'
    }) => trackEvent('campus_selected', props),

    /**
     * A campus address copied from its popup on a campus map. Fires once the
     * clipboard write resolved. Same props as `campus_selected`, minus surface.
     */
    campusAddressCopied: (props: {
      page: 'university' | 'faculty' | 'degree'
      universitySlug?: string
      facultySlug: string
      degreeSlug?: string
      campus: string
    }) => trackEvent('campus_address_copied', props),

    degreeSourceLinkClicked: (props: {
      facultySlug: string
      degreeSlug: string
      source: DegreeSourceLink
    }) => trackEvent('degree_source_link_clicked', props),

    /** Track the yearly admission table being opened under the grade chart. */
    degreeAdmissionTableOpened: (props: {
      facultySlug: string
      degreeSlug: string
    }) => trackEvent('degree_admission_table_opened', props),

    /** Track a related degree opened from the "Relacionados" section. */
    degreeRelatedClicked: (props: {
      facultySlug: string
      degreeSlug: string
      targetFacultySlug: string
      targetDegreeSlug: string
      relationship: string
    }) => trackEvent('degree_related_clicked', props),

    /**
     * Track opening or closing the degree page's collapsed "courses no longer
     * taught" section. `degree_page_viewed` with `pastCourseCount > 0` is the
     * denominator: how often students go looking for a course that left the
     * plan. A search that matches one opens the section on its own, and that
     * does not fire this: only the student's own click does.
     */
    degreePastCoursesToggled: (props: {
      facultySlug: string
      degreeSlug: string
      expanded: boolean
      pastCourseCount: number
    }) => trackEvent('degree_past_courses_toggled', props),

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
      trackEvent('course_filter_applied', props)
  },

  university: {
    /** `/unis` load: the list of every university we cover */
    universitiesPageViewed: (props: { universityCount: number }) =>
      trackEvent('universities_page_viewed', props),

    /**
     * A university page load (`/unis/:uniSlug` and its sub-pages). Entry and
     * denominator for everything below; `sections` lists what the main page
     * rendered, so reach can be read per section.
     */
    universityPageViewed: (props: {
      universitySlug: string
      page: UniversityPageKind
      facultyCount: number
      sections?: string[]
      /** On `degrees` pages: the type shown, null on `/cursos` */
      degreeType?: string | null
      degreeCount?: number
    }) => trackEvent('university_page_viewed', props),

    /** A main-page section scrolled into view, once per section per view */
    sectionViewed: (props: { universitySlug: string; section: string }) =>
      trackEvent('university_section_viewed', props),

    tocClicked: (props: {
      universitySlug: string
      section: string
      surface: 'sidebar' | 'mobile_sheet'
    }) => trackEvent('university_toc_clicked', props),

    tocOpened: (props: { universitySlug: string }) =>
      trackEvent('university_toc_opened', props),

    /**
     * A link out of a university page: into a faculty, a degree, a sub-page or
     * the official site. `surface` is the block it was in.
     */
    linkClicked: (props: {
      universitySlug: string | null
      page: UniversityPageKind | 'list'
      target: UniversityLinkTarget
      surface: string
    }) => trackEvent('university_link_clicked', props),

    /** Faculty chip on `/unis/:uniSlug/licenciaturas` (null = all) */
    bachelorsFilterSelected: (props: {
      universitySlug: string
      facultySlug: string | null
    }) => trackEvent('university_bachelors_filter_selected', props),

    /** Faculty chip on `/cursos` and the type pages (null = all) */
    degreesFilterSelected: (props: {
      universitySlug: string
      degreeType: string | null
      facultySlug: string | null
    }) => trackEvent('university_degrees_filter_selected', props),

    /**
     * A column header clicked on a degree table (`/licenciaturas`, `/cursos`,
     * the type pages). `degreeType` is null on `/licenciaturas` and `/cursos`.
     */
    tableSorted: (props: {
      universitySlug: string
      page: UniversityPageKind
      degreeType: string | null
      column: string
      direction: 'asc' | 'desc'
    }) => trackEvent('university_table_sorted', props)
  },

  faculty: {
    /**
     * A faculty type page load (`/ist/licenciaturas`, ...). The hub keeps
     * `faculty_page_viewed`; both carry the sections they rendered so reach can
     * be read per section.
     */
    typePageViewed: (props: {
      facultySlug: string
      type: FacultyPageKind
      degreeCount: number
      sections: string[]
    }) => trackEvent('faculty_type_page_viewed', props),

    /** A section scrolled into view, once per section per page view */
    sectionViewed: (props: {
      facultySlug: string
      page: FacultyPageKind
      section: string
    }) => trackEvent('faculty_section_viewed', props),

    tocClicked: (props: {
      facultySlug: string
      page: FacultyPageKind
      section: string
      surface: 'sidebar' | 'mobile_sheet'
    }) => trackEvent('faculty_toc_clicked', props),

    tocOpened: (props: { facultySlug: string; page: FacultyPageKind }) =>
      trackEvent('faculty_toc_opened', props),

    /**
     * A link out of a faculty page: into a degree (or its /ingresso), a type
     * page, the university, a course. `surface` is the block it was in.
     */
    linkClicked: (props: {
      facultySlug: string
      page: FacultyPageKind
      target: FacultyLinkTarget
      surface: string
    }) => trackEvent('faculty_link_clicked', props),

    /** A degree-type chip in the hub's "Cursos" table */
    degreeTypeSelected: (props: { facultySlug: string; type: string }) =>
      trackEvent('faculty_degree_type_selected', props)
  },

  course: {
    /**
     * A course page load (since 2026-10-25, when the tabs became sections).
     * Carries the sections it rendered, so reach can be read per section.
     */
    pageViewed: (props: {
      courseId: number
      feedbackCount: number
      sections: CourseSectionId[]
    }) => trackEvent('course_page_viewed', props),

    /** A section scrolled into view, once per section per page view */
    sectionViewed: (props: { courseId: number; section: CourseSectionId }) =>
      trackEvent('course_section_viewed', props),

    tocClicked: (props: {
      courseId: number
      section: CourseSectionId
      surface: 'sidebar' | 'mobile_sheet'
    }) => trackEvent('course_toc_clicked', props),

    tocOpened: (props: { courseId: number }) =>
      trackEvent('course_toc_opened', props),

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

  /**
   * "O meu percurso": the degrees a student declares, and the one-time guess.
   *
   * Funnel: `journey_viewed` / `journey_chat_prompt_shown` (entry) →
   * `journey_degree_form_opened` → `journey_degree_saved` /
   * `journey_degree_save_failed` / `journey_degree_form_cancelled`. The guess
   * has its own short path: `journey_inferred_confirmed` (one click) or
   * `journey_inferred_dismissed`, with "edit" going through the form and
   * landing as `journey_degree_saved{fromInferred: true}`.
   */
  journey: {
    /**
     * The profile's "O meu percurso" tab rendered. Denominator for the profile
     * surface. `fromDot` is whether the account-menu dot was still unseen,
     * which is how we tell whether the dot brings anyone in.
     */
    viewed: (props: {
      degreeCount: number
      hasInferred: boolean
      fromDot: boolean
    }) => trackEvent('journey_viewed', props),

    /** The chat empty state asked for their degree. Once per mount. */
    chatPromptShown: (props: { state: JourneyChatPromptState }) =>
      trackEvent('journey_chat_prompt_shown', props),

    /** "Agora não" on the chat prompt. */
    chatPromptDismissed: (props: { state: JourneyChatPromptState }) =>
      trackEvent('journey_chat_prompt_dismissed', props),

    inferredConfirmed: (props: {
      surface: JourneySurface
      degreeId: number
      hasStartYear: boolean
    }) => trackEvent('journey_inferred_confirmed', props),

    /** "Não é o meu curso". The guess never comes back after this. */
    inferredDismissed: (props: { surface: JourneySurface; degreeId: number }) =>
      trackEvent('journey_inferred_dismissed', props),

    degreeFormOpened: (props: {
      surface: JourneySurface
      mode: JourneyFormMode
    }) => trackEvent('journey_degree_form_opened', props),

    /**
     * Closed without saving. `step` is how far they got, so a drop at the
     * degree picker (cannot find their degree) reads differently from one at
     * the years.
     */
    degreeFormCancelled: (props: {
      surface: JourneySurface
      mode: JourneyFormMode
      step: 'faculty' | 'degree' | 'years'
    }) => trackEvent('journey_degree_form_cancelled', props),

    degreeSaved: (props: {
      surface: JourneySurface
      mode: JourneyFormMode
      degreeId: number
      facultyId: number
      hasStartYear: boolean
      hasEndYear: boolean
      /** Saved from the inferred guess, either as-is or edited. */
      fromInferred: boolean
      /** Edited the guess into a different degree: the guess was wrong. */
      changedInferredDegree: boolean
    }) => trackEvent('journey_degree_saved', props),

    degreeSaveFailed: (props: {
      surface: JourneySurface
      mode: JourneyFormMode
      /** HTTP status when known: 409 = already in the profile. */
      status: number | null
    }) => trackEvent('journey_degree_save_failed', props),

    degreeRemoved: (props: { degreeId: number; remainingCount: number }) =>
      trackEvent('journey_degree_removed', props)
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
    resultsLinkClicked: (props: {
      source:
        | 'giveaway_hero'
        | 'giveaway_hero_announced'
        | 'giveaway_hero_drawing'
        | 'landing_promo_announced'
        | 'landing_promo_ended'
      referrerPage?: string
    }) => trackEvent('giveaway_results_link_clicked', props)
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
    }) => trackEvent('feedback_form_link_clicked', props),

    /**
     * A destination link in the site chrome (browse, chat). Feedback keeps its
     * own event above because it is the head of a funnel; these are plain
     * navigation, tracked so we can see how the redesign redistributed clicks
     * between the bar, the drawer and the footer.
     */
    navLinkClicked: (props: {
      destination: 'browse' | 'chat' | 'universities'
      surface: NavSurface
      referrerPage?: string
    }) => trackEvent('nav_link_clicked', props),

    /**
     * A breadcrumb was clicked. The trail follows the hierarchy (universities,
     * university, faculty, degree), not the URL, so this shows whether students
     * actually climb it, and which level they climb to.
     */
    breadcrumbClicked: (props: {
      level: Exclude<CrumbLevel, 'current'>
      surface: BreadcrumbSurface
      /** How many levels up from the page: 1 is its parent */
      levelsUp: number
    }) => trackEvent('breadcrumb_clicked', props),

    /**
     * The account popover or mobile drawer was opened. Pairs with
     * `nav_preference_changed` to show how many people who open it are actually
     * after a preference rather than their profile.
     */
    accountMenuOpened: (props: {
      surface: NavSurface
      isAuthenticated: boolean
    }) => trackEvent('nav_account_menu_opened', props),

    /**
     * Theme or language was changed. Neither was ever tracked, which is why the
     * decision to demote them off the navbar had to be inferred from locale
     * pageviews. This measures it directly from now on.
     */
    preferenceChanged: (
      props: (
        | { preference: 'theme'; value: ThemePreference }
        | { preference: 'language'; value: Lang }
      ) & {
        surface: NavSurface
        isAuthenticated: boolean
      }
    ) => trackEvent('nav_preference_changed', props)
  },

  /**
   * AI chat.
   *
   * The funnel is: entry -> first message -> answer -> citation click, with the
   * refusals (coverage wall, quota) as their own steps so drop-off is visible
   * rather than inferred. `source` on every entry event is what lets us ask the
   * question the context columns were added for: do students who arrive from a
   * course page get better answers than those starting cold?
   */
  /**
   * The landing page. Before these existed, the only evidence of how it was used
   * was PostHog's scroll percentage and autocapture clicks (2026-10-18): the
   * median visit saw about one screen, and the hero search was used by roughly
   * eight times as many people as the course picker. These turn that into
   * per-section reach and per-component funnels that survive a reorder.
   */
  landing: {
    /**
     * A section's top came into view (once per section per page view). The
     * per-section reach curve: `hero` fires on load and is the denominator.
     * `position` is the section's place in the page order at the time, so a
     * reorder shows up as the same section at a new position rather than as a
     * break in the series.
     */
    sectionViewed: (props: {
      section: LandingSection
      position: number
      isAuthenticated: boolean
    }) => trackEvent('landing_section_viewed', props),

    /**
     * The hero search box got focus, once per page view. Top of the search
     * funnel: focused -> `course_search_performed{surface: 'landing_hero'}` ->
     * `landing_search_result_clicked`.
     */
    searchFocused: () => trackEvent('landing_search_focused', {}),

    /**
     * A hero search result was opened. `position` is the row's index within its
     * group (courses, degrees, faculties), `resultsCount` the total shown. The
     * query text is not sent here; it is on the `course_search_performed`
     * before it.
     */
    searchResultClicked: (props: {
      resultType: LandingSearchResultType
      position: number | null
      resultsCount: number
      queryLength: number
    }) => trackEvent('landing_search_result_clicked', props),

    /**
     * A faculty picked in the "Que curso estás a tirar?" section. `layout` says
     * which control: chips on mobile, the side list on desktop. `position` is
     * its place in the activity-sorted list.
     */
    pickerFacultySelected: (props: {
      facultySlug: string | null
      position: number
      layout: 'mobile_chips' | 'desktop_list'
    }) => trackEvent('landing_picker_faculty_selected', props),

    /**
     * A degree card opened from the picker. The picker's conversion step.
     * `changedFaculty` is false when the student took a degree of the
     * preselected (most active) faculty without touching the list.
     */
    pickerDegreeClicked: (props: {
      facultySlug: string | null
      degreeSlug: string | null
      position: number
      changedFaculty: boolean
    }) => trackEvent('landing_picker_degree_clicked', props),

    /** The picker's "see all degrees" link to the faculty page. */
    pickerSeeAllClicked: (props: { facultySlug: string | null }) =>
      trackEvent('landing_picker_see_all_clicked', props),

    /**
     * The live feed carousel scrolled sideways for the first time in this page
     * view. `method` separates the desktop arrows from a swipe or trackpad.
     * Its reach is `landing_section_viewed{section: 'live_feed'}`.
     */
    feedScrolled: (props: { method: 'arrow' | 'swipe' }) =>
      trackEvent('landing_feed_scrolled', props),

    /** A review card in the live feed opened (it links to that review). */
    feedCardClicked: (props: {
      feedbackId: number
      courseId: number
      position: number
    }) => trackEvent('landing_feed_card_clicked', props)
  },

  chat: {
    opened: (props: {
      source:
        | 'navbar'
        | 'mobile_menu'
        | 'footer'
        | 'landing'
        | 'browse_page'
        | 'course_page'
        | 'course_page_inline'
        | 'landing_inline'
        | 'degree_page'
        | 'degree_page_prompt'
        | 'faq'
        | 'faculty_page'
        | 'direct'
      hasContext: boolean
      /**
       * Whether they arrived already signed in.
       *
       * The chat is login-gated, so this is what splits the one surface into
       * its two funnels: a signed-out arrival is a signup funnel and has a
       * login wall in the middle, a signed-in one goes straight to an answer.
       * Measuring them as one funnel makes the wall look like a step that 80%
       * of people skip, which reads as drop-off it is not.
       */
      isAuthenticated: boolean
      /** Their existing conversations, or null when we cannot know: a
       *  signed-out visitor's list is a 401, not an empty list. */
      chatCount: number | null
      /**
       * The page they came from. `source` says which entry point (`faq`,
       * `navbar`, ...) but not which page it sat on. `referrerPath` is the
       * pathname (`/ist/leic-a/ingresso`), `referrerPage` its `getPageName`
       * bucket; both null for an external arrival.
       */
      referrerPath: string | null
      referrerPage: string | null
    }) => trackEvent('chat_opened', props),

    /**
     * "Tens outra pergunta? Pergunta ao nosso chat" under an FAQ. The chat then
     * opens with `source: 'faq'` (and `referrerPage` naming the page).
     */
    faqFooterClicked: (props: {
      /** The page whose FAQ it was (see `FaqSurface`) */
      surface:
        | 'degree_page'
        | 'degree_admission_page'
        | 'degree_careers_page'
        | 'faculty_page'
        | 'faculty_type_page'
        | 'university_page'
      /** Set on degree pages, where the chat opens scoped to the degree */
      degreeId: number | null
      /** `contact` when the chat entry points are switched off */
      destination: 'chat' | 'contact'
      isAuthenticated: boolean
    }) => trackEvent('chat_faq_footer_clicked', props),

    /**
     * A question link on the degree page ("Qual é o ano mais pesado de LEIC?
     * Pergunta ao nosso chat"). The chat opens with `source: 'degree_page_prompt'` and
     * sends the question itself (signed out, after the login wall). `template`
     * is which question, so we can see which ones convert.
     */
    degreePromptClicked: (props: {
      degreeId: number
      template: 'heaviest_year' | 'hardest_course' | 'best_courses'
      section: DegreeSectionId
      isAuthenticated: boolean
    }) => trackEvent('chat_degree_prompt_clicked', props),

    /**
     * A question typed into an ask box outside the chat (the course page's, or
     * the landing page section's), before the chat page opens. The next step is
     * `chat_opened{source: '<source>_inline'}` on the chat page, which sends the
     * question itself. Kept separate so a drop between typing and the chat
     * loading is visible.
     */
    inlinePromptSubmitted: (props: {
      source: 'course_page' | 'landing'
      /** Null on the landing page, whose box is not about one course. */
      courseId: number | null
      isAuthenticated: boolean
      messageLength: number
    }) => trackEvent('chat_inline_prompt_submitted', props),

    messageSent: (props: {
      /** The chat's public id, or 'new' for a first message. */
      chatId: string
      isFirstMessage: boolean
      hasContext: boolean
      messageLength: number
      usedSuggestion: boolean
    }) => trackEvent('chat_message_sent', props),

    answerReceived: (props: {
      chatId: string
      latencyMs: number
      toolsUsed: string[]
      guardsFired: string[]
      answerLength: number
    }) => trackEvent('chat_answer_received', props),

    /** The whole point of grounding: did the answer send them into the site? */
    citationClicked: (props: {
      chatId: string
      entityType: 'course' | 'degree' | 'faculty'
      href: string
    }) => trackEvent('chat_citation_clicked', props),

    rated: (props: {
      messageId: number
      rating: 'helpful' | 'not_helpful'
      hasComment: boolean
    }) => trackEvent('chat_message_rated', props),

    /** Took a rating back. Kept separate so "changed their mind" is visible. */
    ratingCleared: (props: { messageId: number }) =>
      trackEvent('chat_message_rating_cleared', props),

    /** Abandonment: they closed or navigated away while an answer was in flight. */
    abandoned: (props: { chatId: string; waitedMs: number }) =>
      trackEvent('chat_answer_abandoned', props),

    /** Refusals, each its own step so the funnel shows where students are lost. */
    restingShown: (props: { code: string }) =>
      trackEvent('chat_resting_shown', props),

    /**
     * The login wall. `loginWallShown` fires when they try to send without an
     * account, which is the moment of intent, not on arrival: the requirement is
     * stated above the composer long before this.
     */
    loginWallShown: (props: { hasContext: boolean; source: string }) =>
      trackEvent('chat_login_wall_shown', props),

    loginWallCompleted: (props: { source: string }) =>
      trackEvent('chat_login_wall_completed', props),

    /** Closed the dialog without signing in. The question is kept either way. */
    loginWallAbandoned: (props: { source: string }) =>
      trackEvent('chat_login_wall_abandoned', props),

    /**
     * Retrieval came back empty and the answer carried an ask.
     *
     * This is the coverage signal that the removed per-faculty gate used to
     * approximate, except measured on real questions instead of guessed in
     * advance.
     */
    gapShown: (props: {
      chatId: string
      kind: string
      courseId: number | null
    }) => trackEvent('chat_gap_shown', props),

    gapActionClicked: (props: {
      chatId: string
      kind: string
      action: 'share' | 'review' | 'correct' | 'add_course' | 'request_access'
    }) => trackEvent('chat_gap_action_clicked', props),

    /** The door for people who cannot sign up at all. */
    accessRequestOpened: (props: { source: string }) =>
      trackEvent('chat_access_request_opened', props),

    accessRequestSubmitted: (props: {
      source: string
      facultyCount: number
      hasQuestion: boolean
    }) => trackEvent('chat_access_request_submitted', props),

    /**
     * They opened the form again having already sent one, so it showed the
     * receipt instead. Pairs with `chat_access_request_opened` to separate
     * people still waiting from fresh demand, which the opened count alone
     * silently mixes together.
     */
    accessRequestAlreadySent: (props: { source: string }) =>
      trackEvent('chat_access_request_already_sent', props),

    quotaReached: (props: { chatId: string }) =>
      trackEvent('chat_quota_reached', props),

    errorShown: (props: { chatId: string; message: string }) =>
      trackEvent('chat_error_shown', props)
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
 * Report an error PostHog would not see on its own: one that React Router
 * caught and rendered (ErrorBoundary), or one we caught and handled.
 * Uncaught errors are already captured by `capture_exceptions` in root.tsx.
 */
export const captureError = (
  error: unknown,
  properties?: Record<string, unknown>
) => {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.captureException(error, properties)
}

/**
 * Reset user identification (on logout)
 */
export const resetUser = () => {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.reset()
}
