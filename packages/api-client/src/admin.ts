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
  facultyId: number
  facultyName: string
  facultyShortName: string
  totalFeedbackCount: number
  terms: string[] | null
  createdAt: string
}

export interface AdminCoursesQuery {
  page?: number
  limit?: number
  search?: string
  degree_id?: number
  faculty_id?: number
  term?: string
}

export interface AdminCoursesResponse {
  courses: AdminCourse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Admin Course Detail Types
export interface AdminCourseDetail {
  id: number
  name: string
  acronym: string
  ects: number | null
  terms: string[] | null
  description: string | null
  bibliography: string | null
  assessment: string | null
  hasMandatoryExam: boolean | null
  degreeId: number
  degreeName: string
  degreeAcronym: string
  facultyId: number
  facultyName: string
  facultyShortName: string
  totalFeedbackCount: number
  createdAt: string
  updatedAt: string
}

export interface CourseUpdateData {
  name?: string
  acronym?: string
  ects?: number | null
  description?: string | null
  bibliography?: string | null
  assessment?: string | null
  hasMandatoryExam?: boolean | null
}

export interface CourseTermsResponse {
  courseId: number
  terms: string[]
}

export interface AllTermsResponse {
  terms: string[]
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
export interface FeedbackAnalysis {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
  wordCount: number
  createdAt?: string
  reviewedAt?: string | null
  updatedAt?: string
}

export interface AdminFeedback {
  id: number
  email: string | null
  schoolYear: number | null
  rating: number
  workloadRating: number | null
  comment: string | null
  approved: boolean
  approvedAt: string | null
  createdAt: string
  courseId: number
  courseName: string
  courseAcronym: string
  degreeId: number
  degreeName: string
  degreeAcronym: string
  facultyId: number
  facultyName: string
  facultyShortName: string
  analysis: FeedbackAnalysis | null
  points: number | null
}

export interface AdminFeedbackDetail extends AdminFeedback {
  updatedAt: string
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
  course_id?: number
  degree_id?: number
  faculty_id?: number
  email?: string
  approved?: boolean
  rating?: number
  workload_rating?: number
  has_comment?: boolean
  school_year?: number
  created_after?: string
  reviewed?: boolean
}

export interface FeedbackUpdateData {
  schoolYear?: number | null
  rating?: number
  workloadRating?: number | null
  comment?: string | null
}

export interface FeedbackAnalysisUpdateData {
  hasTeaching: boolean
  hasAssessment: boolean
  hasMaterials: boolean
  hasTips: boolean
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
 * Get feedback for admin dashboard (legacy - use getAdminFeedbackNew instead)
 */
export async function getAdminFeedback(
  query?: AdminFeedbackQuery
): Promise<AdminFeedbackResponse> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.course_id) params.set('course_id', query.course_id.toString())
  if (query?.degree_id) params.set('degree_id', query.degree_id.toString())
  if (query?.faculty_id) params.set('faculty_id', query.faculty_id.toString())
  if (query?.email) params.set('email', query.email)
  if (query?.approved !== undefined)
    params.set('approved', query.approved.toString())

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
export async function getAdminDegreeTypes(
  facultyId?: number
): Promise<DegreeTypesResponse> {
  const params = new URLSearchParams()
  if (facultyId) params.set('faculty_id', facultyId.toString())

  const url = params.toString()
    ? `/admin/degrees/types?${params}`
    : '/admin/degrees/types'
  return apiGet<DegreeTypesResponse>(url)
}

// Suggestion Types
export interface DegreeSuggestion {
  id: number
  name: string
  acronym: string
}

/**
 * Get degrees for filtering/suggestions (lightweight, no pagination)
 */
export async function getDegreeSuggestions(
  facultyId?: number
): Promise<DegreeSuggestion[]> {
  const params = new URLSearchParams()
  if (facultyId) params.set('faculty_id', facultyId.toString())

  const url = params.toString()
    ? `/admin/suggestions/degrees?${params}`
    : '/admin/suggestions/degrees'
  return apiGet<DegreeSuggestion[]>(url)
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

  const url = params.toString()
    ? `/admin/course-groups?${params}`
    : '/admin/course-groups'
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
  if (query?.faculty_id) params.set('faculty_id', query.faculty_id.toString())
  if (query?.term) params.set('term', query.term)

  const url = params.toString() ? `/admin/courses?${params}` : '/admin/courses'
  return apiGet<PaginatedResponse<AdminCourse>>(url)
}

/**
 * Get detailed course information
 */
export async function getAdminCourseDetails(
  courseId: number
): Promise<AdminCourseDetail> {
  return apiGet<AdminCourseDetail>(`/admin/courses/${courseId}`)
}

/**
 * Update course information
 */
export async function updateCourse(
  courseId: number,
  updates: CourseUpdateData
): Promise<AdminCourseDetail> {
  return apiPut<AdminCourseDetail>(`/admin/courses/${courseId}`, updates)
}

/**
 * Get course terms
 */
export async function getCourseTerms(
  courseId: number
): Promise<CourseTermsResponse> {
  return apiGet<CourseTermsResponse>(`/admin/courses/${courseId}/terms`)
}

/**
 * Add term to course
 */
export async function addCourseTerm(
  courseId: number,
  term: string
): Promise<{ courseId: number; terms: string[]; message: string }> {
  return apiPost<{
    courseId: number
    terms: string[]
    message: string
  }>(`/admin/courses/${courseId}/terms`, { term })
}

/**
 * Remove term from course
 */
export async function removeCourseTerm(
  courseId: number,
  term: string
): Promise<{ courseId: number; terms: string[]; message: string }> {
  const encodedTerm = encodeURIComponent(term)
  return apiDelete<{
    courseId: number
    terms: string[]
    message: string
  }>(`/admin/courses/${courseId}/terms/${encodedTerm}`)
}

/**
 * Get all distinct course terms with optional faculty filtering
 */
export async function getAllTerms(
  facultyId?: number
): Promise<AllTermsResponse> {
  const params = new URLSearchParams()
  if (facultyId) params.set('faculty_id', facultyId.toString())

  const url = params.toString()
    ? `/admin/courses/terms?${params}`
    : '/admin/courses/terms'
  return apiGet<AllTermsResponse>(url)
}

/**
 * Get feedback for admin dashboard (new version)
 */
export async function getAdminFeedbackNew(
  query?: AdminFeedbackQuery
): Promise<PaginatedResponse<AdminFeedback>> {
  const params = new URLSearchParams()
  if (query?.page) params.set('page', query.page.toString())
  if (query?.limit) params.set('limit', query.limit.toString())
  if (query?.course_id) params.set('course_id', query.course_id.toString())
  if (query?.degree_id) params.set('degree_id', query.degree_id.toString())
  if (query?.faculty_id) params.set('faculty_id', query.faculty_id.toString())
  if (query?.email) params.set('email', query.email)
  if (query?.approved !== undefined)
    params.set('approved', query.approved.toString())
  if (query?.rating) params.set('rating', query.rating.toString())
  if (query?.workload_rating)
    params.set('workload_rating', query.workload_rating.toString())
  if (query?.has_comment !== undefined)
    params.set('has_comment', query.has_comment.toString())
  if (query?.school_year)
    params.set('school_year', query.school_year.toString())
  if (query?.created_after) params.set('created_after', query.created_after)
  if (query?.reviewed !== undefined)
    params.set('reviewed', query.reviewed.toString())

  const url = params.toString()
    ? `/admin/feedback?${params}`
    : '/admin/feedback'
  return apiGet<PaginatedResponse<AdminFeedback>>(url)
}

/**
 * Get detailed feedback information
 */
export async function getAdminFeedbackDetails(
  feedbackId: number
): Promise<AdminFeedbackDetail> {
  return apiGet<AdminFeedbackDetail>(`/admin/feedback/${feedbackId}`)
}

/**
 * Update feedback information
 */
export async function updateFeedback(
  feedbackId: number,
  updates: FeedbackUpdateData
): Promise<{
  id: number
  schoolYear: number | null
  rating: number
  workloadRating: number | null
  comment: string | null
  approved: boolean
  updatedAt: string
  message: string
}> {
  return apiPut<{
    id: number
    schoolYear: number | null
    rating: number
    workloadRating: number | null
    comment: string | null
    approved: boolean
    updatedAt: string
    message: string
  }>(`/admin/feedback/${feedbackId}`, updates)
}

/**
 * Approve feedback
 */
export async function approveFeedback(feedbackId: number): Promise<{
  id: number
  approved: boolean
  approvedAt: string
  message: string
}> {
  return apiPost<{
    id: number
    approved: boolean
    approvedAt: string
    message: string
  }>(`/admin/feedback/${feedbackId}/approved`, {})
}

/**
 * Unapprove feedback
 */
export async function unapproveFeedback(
  feedbackId: number,
  message: string
): Promise<{
  id: number
  approved: boolean
  approvedAt: null
  message: string
}> {
  return apiDelete<{
    id: number
    approved: boolean
    approvedAt: null
    message: string
  }>(`/admin/feedback/${feedbackId}/approved`, { message })
}

/**
 * Update or create feedback analysis
 */
export async function updateFeedbackAnalysis(
  feedbackId: number,
  analysis: FeedbackAnalysisUpdateData
): Promise<{
  feedbackId: number
  analysis: FeedbackAnalysis
  points: number | null
  message: string
}> {
  return apiPut<{
    feedbackId: number
    analysis: FeedbackAnalysis
    points: number | null
    message: string
  }>(`/admin/feedback/${feedbackId}/analysis`, analysis)
}
