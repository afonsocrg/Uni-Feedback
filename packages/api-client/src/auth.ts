import { apiGet, apiPost, apiPostVoid } from './utils'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    email: string
    username: string
    superuser: boolean
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
  superuser: boolean
  createdAt: string
  updatedAt: string
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
 * Get all users (superuser only)
 */
export async function getUsers(): Promise<User[]> {
  return apiGet<User[]>('/users')
}
