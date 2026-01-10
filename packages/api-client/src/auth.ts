import { apiDelete, apiGet, apiPost, apiPostVoid } from './utils'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    email: string
    username: string
    role: string
    referralCode: string
  }
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface CreateAccountRequest {
  token: string
  username: string
  password: string
  confirmPassword: string
}

export interface InviteUserRequest {
  email: string
}

export interface User {
  id: number
  email: string
  username: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface RequestMagicLinkRequest {
  email: string
  enablePolling?: boolean
  requestId?: string
  referralCode?: string
}

export interface UseMagicLinkRequest {
  token: string
}

export interface ProfileResponse {
  user: {
    id: number
    email: string
    username: string
    role: string
    referralCode: string | null
  }
}

export interface UserStatsResponse {
  stats: {
    totalPoints: number
    feedbackCount: number
    feedbackPoints: number
    referralCount: number
    referralPoints: number
  }
}

export interface UserFeedback {
  id: number
  courseId: number
  courseName: string
  courseCode: string
  schoolYear: number | null
  rating: number
  workloadRating: number | null
  comment: string | null
  points: number | null
  approvedAt: string | null
  createdAt: string
  analysis: {
    hasTeaching: boolean
    hasAssessment: boolean
    hasMaterials: boolean
    hasTips: boolean
    wordCount: number
  } | null
}

export interface UserFeedbackResponse {
  feedback: UserFeedback[]
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', data)
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  return apiPostVoid('/auth/logout')
}

/**
 * Refresh authentication token
 */
export async function refreshToken(): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/refresh')
}

/**
 * Request password reset
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/forgot-password', data, {
    requiresAuth: false
  })
}

/**
 * Reset password with token
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/reset-password', data, {
    requiresAuth: false
  })
}

/**
 * Create account with invitation token
 */
export async function createAccount(
  data: CreateAccountRequest
): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/create-account', data)
}

/**
 * Invite a new user (superuser only)
 */
export async function inviteUser(
  data: InviteUserRequest
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/invite', data)
}

/**
 * Request magic link for email
 */
export async function requestMagicLink(
  data: RequestMagicLinkRequest
): Promise<{ message: string; requestId?: string }> {
  return apiPost<{ message: string; requestId?: string }>(
    '/auth/magic-links',
    data,
    {
      requiresAuth: false
    }
  )
}

/**
 * Verify magic link token and create session
 */
export async function useMagicLink(
  data: UseMagicLinkRequest
): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/magic-links/use', data)
}

export interface VerifyMagicLinkByRequestIdRequest {
  requestId: string
}

export interface VerifyMagicLinkResponse {
  status?: 'pending'
  user?: {
    id: number
    email: string
    username: string
    role: string
  }
}

/**
 * Verify magic link by request ID (polling-based verification)
 */
export async function verifyMagicLinkByRequestId(
  data: VerifyMagicLinkByRequestIdRequest
): Promise<VerifyMagicLinkResponse> {
  return apiPost<VerifyMagicLinkResponse>('/auth/magic-links/verify', data)
}

/**
 * Get all users (superuser only)
 */
export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>('/admin/users')
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('/auth/profile')
}

/**
 * Delete current user account (GDPR-compliant)
 * Permanently deletes account by anonymizing personal data while preserving feedback
 */
export async function deleteAccount(): Promise<{ message: string }> {
  return apiDelete<{ message: string }>('/auth/profile')
}

/**
 * Get current user statistics (points, referrals, feedback count)
 */
export async function getUserStats(): Promise<UserStatsResponse> {
  return apiGet<UserStatsResponse>('/auth/profile/stats')
}

/**
 * Get current user's feedback
 */
export async function getUserFeedback(): Promise<UserFeedbackResponse> {
  const result = apiGet<UserFeedbackResponse>('/auth/profile/feedback')
  console.log('getUserFeedback', result)
  return result
}
