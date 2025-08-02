import { apiDelete, apiGet, apiPost, apiPut } from './utils'

// Generic Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

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
  acronym: string
  ects: number | null
  degreeId: number
  degreeName: string
  degreeAcronym: string
  facultyName: string
  feedbackCount: number
  terms: string[] | null
  createdAt: string
}

export interface AdminCoursesQuery {
  page?: number
  limit?: number
  search?: string
  degree_id?: number
}

export interface AdminCoursesResponse {
  courses: AdminCourse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Admin Degrees Types
export interface AdminDegree {
  id: number
  name: string
  acronym: string
  type: string
  facultyId: number
  facultyName: string
  facultyShortName: string
  courseCount: number
  createdAt: string
}

export interface AdminDegreeDetail {
  id: number
  name: string
  acronym: string
  type: string
  description: string | null
  facultyId: number
  facultyName: string
  facultyShortName: string
  courseCount: number
  createdAt: string
  updatedAt: string
}

export interface DegreeUpdateData {
  name?: string
  acronym?: string
  type?: string
  description?: string | null
}

export interface DegreeTypesResponse {
  types: string[]
}

export interface AdminDegreesQuery {
  page?: number
  limit?: number
  search?: string
  faculty_id?: number
  type?: string
}

// Admin Course Groups Types
export interface AdminCourseGroup {
  id: number
  name: string
  degreeId: number
  degreeName: string
  degreeAcronym: string
  facultyName: string
  createdAt: string
}

export interface CreateCourseGroupRequest {
  name: string
  degreeId: number
}

export interface UpdateCourseGroupRequest {
  name?: string
}

export interface AdminCourseGroupsQuery {
  page?: number
  limit?: number
  search?: string
  degree_id?: number
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
  if (query?.degree_id) params.set('degree_id', query.degree_id.toString())

  const url = params.toString() ? `/admin/courses?${params}` : '/admin/courses'
  return apiGet<AdminCoursesResponse>(url)
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

/**
 * Get degrees for admin dashboard (new paginated version)
 */
export async function getAdminDegrees(
  query?: AdminDegreesQuery
): Promise<PaginatedResponse<AdminDegree>> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.faculty_id) params.set('faculty_id', query.faculty_id.toString())
  if (query?.type) params.set('type', query.type)

  const url = params.toString() ? `/admin/degrees?${params}` : '/admin/degrees'
  return apiGet<PaginatedResponse<AdminDegree>>(url)
}

/**
 * Get all degree types for filtering
 */
export async function getAdminDegreeTypes(facultyId?: number): Promise<DegreeTypesResponse> {
  const params = new URLSearchParams()
  if (facultyId) params.set('faculty_id', facultyId.toString())
  
  const url = params.toString() ? `/admin/degrees/types?${params}` : '/admin/degrees/types'
  return apiGet<DegreeTypesResponse>(url)
}

/**
 * Get detailed degree information
 */
export async function getAdminDegreeDetails(
  degreeId: number
): Promise<AdminDegreeDetail> {
  return apiGet<AdminDegreeDetail>(`/admin/degrees/${degreeId}`)
}

/**
 * Update degree information
 */
export async function updateDegree(
  degreeId: number,
  updates: DegreeUpdateData
): Promise<AdminDegreeDetail> {
  return apiPut<AdminDegreeDetail>(`/admin/degrees/${degreeId}`, updates)
}

/**
 * Get course groups for admin dashboard
 */
export async function getAdminCourseGroups(
  query?: AdminCourseGroupsQuery
): Promise<PaginatedResponse<AdminCourseGroup>> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.degree_id) params.set('degree_id', query.degree_id.toString())

  const url = params.toString() ? `/admin/course-groups?${params}` : '/admin/course-groups'
  return apiGet<PaginatedResponse<AdminCourseGroup>>(url)
}

/**
 * Create a new course group
 */
export async function createCourseGroup(
  data: CreateCourseGroupRequest
): Promise<AdminCourseGroup> {
  return apiPost<AdminCourseGroup>('/admin/course-groups', data)
}

/**
 * Update course group information
 */
export async function updateCourseGroup(
  id: number,
  data: UpdateCourseGroupRequest
): Promise<AdminCourseGroup> {
  return apiPut<AdminCourseGroup>(`/admin/course-groups/${id}`, data)
}

/**
 * Delete a course group
 */
export async function deleteCourseGroup(id: number): Promise<void> {
  return apiDelete<void>(`/admin/course-groups/${id}`)
}

/**
 * Get courses for admin dashboard (new paginated version)
 */
export async function getAdminCoursesNew(
  query?: AdminCoursesQuery
): Promise<PaginatedResponse<AdminCourse>> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.search) params.set('search', query.search)
  if (query?.degree_id) params.set('degree_id', query.degree_id.toString())

  const url = params.toString() ? `/admin/courses?${params}` : '/admin/courses'
  return apiGet<PaginatedResponse<AdminCourse>>(url)
}
