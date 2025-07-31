import { apiDelete, apiGet, apiPost, apiPut } from './utils'

// Admin Stats Types
export interface AdminStats {
  totalUsers: number
  totalCourses: number
  totalFeedback: number
  totalDegrees: number
  totalFaculties: number
  recentFeedbackCount: number
}

// Admin Users Types
export interface AdminUser {
  id: number
  email: string
  username: string
  superuser: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminUsersQuery {
  page?: number
  limit?: number
  search?: string
}

// Admin Courses Types
export interface AdminCourse {
  id: number
  name: string
  code: string
  credits: number
  semester: string
  schoolYear: string
  degreeId: number
  degreeName: string
  facultyName: string
  feedbackCount: number
  averageRating: number | null
}

export interface AdminCoursesResponse {
  courses: AdminCourse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminCoursesQuery {
  page?: number
  limit?: number
  search?: string
  facultyId?: number
  degreeId?: number
}

// Admin Degrees Types
export interface AdminDegree {
  id: number
  name: string
  code: string
  type: string
  facultyId: number
  facultyName: string
  courseCount: number
  feedbackCount: number
  createdAt: string
}

export interface AdminDegreesResponse {
  degrees: AdminDegree[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminDegreesQuery {
  page?: number
  limit?: number
  search?: string
  facultyId?: number
}

// Admin Faculties Types
export interface AdminFaculty {
  id: number
  name: string
  code: string
  description: string | null
  degreeCount: number
  courseCount: number
  feedbackCount: number
  createdAt: string
}

export interface AdminFacultyDetail {
  id: number
  name: string
  shortName: string
  emailSuffixes: string[]
  degrees: AdminFacultyDegree[]
  degreeCount: number
  createdAt: string
}

export interface AdminFacultyDegree {
  id: number
  name: string
  acronym: string
  type: string
  courseCount: number
}

export interface FacultyUpdateData {
  name?: string
  shortName?: string
}

export interface AdminFacultiesResponse {
  faculties: AdminFaculty[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminFacultiesQuery {
  page?: number
  limit?: number
  search?: string
}

// Admin Feedback Types
export interface AdminFeedback {
  id: number
  courseId: number
  courseName: string
  courseCode: string
  degreeName: string
  facultyName: string
  overallRating: number
  difficultyRating: number
  workloadRating: number
  comment: string | null
  schoolYear: string
  semester: string
  createdAt: string
}

export interface AdminFeedbackResponse {
  feedback: AdminFeedback[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AdminFeedbackQuery {
  page?: number
  limit?: number
  search?: string
  courseId?: number
  startDate?: string
  endDate?: string
}

// API Functions

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  return apiGet<AdminStats>('/admin/stats')
}

/**
 * Get users for admin dashboard
 */
export async function getAdminUsers(
  query?: AdminUsersQuery
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)

  const url = params.toString() ? `/admin/users?${params}` : '/admin/users'
  return apiGet<AdminUsersResponse>(url)
}

/**
 * Get courses for admin dashboard
 */
export async function getAdminCourses(
  query?: AdminCoursesQuery
): Promise<AdminCoursesResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.facultyId) params.set('facultyId', query.facultyId.toString())
  if (query?.degreeId) params.set('degreeId', query.degreeId.toString())

  const url = params.toString() ? `/admin/courses?${params}` : '/admin/courses'
  return apiGet<AdminCoursesResponse>(url)
}

/**
 * Get degrees for admin dashboard
 */
export async function getAdminDegrees(
  query?: AdminDegreesQuery
): Promise<AdminDegreesResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.facultyId) params.set('facultyId', query.facultyId.toString())

  const url = params.toString() ? `/admin/degrees?${params}` : '/admin/degrees'
  return apiGet<AdminDegreesResponse>(url)
}

/**
 * Get faculties for admin dashboard
 */
export async function getAdminFaculties(
  query?: AdminFacultiesQuery
): Promise<AdminFacultiesResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)

  const url = params.toString()
    ? `/admin/faculties?${params}`
    : '/admin/faculties'
  return apiGet<AdminFacultiesResponse>(url)
}

/**
 * Get feedback for admin dashboard
 */
export async function getAdminFeedback(
  query?: AdminFeedbackQuery
): Promise<AdminFeedbackResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.courseId) params.set('courseId', query.courseId.toString())
  if (query?.startDate) params.set('startDate', query.startDate)
  if (query?.endDate) params.set('endDate', query.endDate)

  const url = params.toString()
    ? `/admin/feedback?${params}`
    : '/admin/feedback'
  return apiGet<AdminFeedbackResponse>(url)
}

/**
 * Update faculty information
 */
export async function updateFaculty(
  facultyId: number,
  updates: FacultyUpdateData
): Promise<AdminFacultyDetail> {
  return apiPut<AdminFacultyDetail>(`/admin/faculties/${facultyId}`, updates)
}

/**
 * Get faculty email suffixes
 */
export async function getFacultyEmailSuffixes(
  facultyId: number
): Promise<{ facultyId: number; emailSuffixes: string[] }> {
  return apiGet<{ facultyId: number; emailSuffixes: string[] }>(
    `/admin/faculties/${facultyId}/email-suffixes`
  )
}

/**
 * Add email suffix to faculty
 */
export async function addFacultyEmailSuffix(
  facultyId: number,
  suffix: string
): Promise<{ facultyId: number; emailSuffixes: string[]; message: string }> {
  return apiPost<{
    facultyId: number
    emailSuffixes: string[]
    message: string
  }>(`/admin/faculties/${facultyId}/email-suffixes`, { suffix })
}

/**
 * Remove email suffix from faculty
 */
export async function removeFacultyEmailSuffix(
  facultyId: number,
  suffix: string
): Promise<{ facultyId: number; emailSuffixes: string[]; message: string }> {
  const encodedSuffix = encodeURIComponent(suffix)
  return apiDelete<{
    facultyId: number
    emailSuffixes: string[]
    message: string
  }>(`/admin/faculties/${facultyId}/email-suffixes/${encodedSuffix}`)
}
