import { API_BASE_URL } from './config'
import {
  Course,
  CourseDetail,
  CourseSearchResponse,
  Feedback,
  SearchCoursesParams
} from './types'
import { apiGet } from './utils'

// Re-export types for convenience
export type { CourseSearchResponse, SearchCoursesParams } from './types'

interface GetCoursesParams {
  acronym?: string
  degreeId?: number
  faculty?: string
  degree?: string
}
export async function getCourses({
  acronym,
  degreeId,
  faculty,
  degree
}: GetCoursesParams = {}): Promise<Course[]> {
  const url = new URL(`${API_BASE_URL}/courses`)
  if (acronym) {
    url.searchParams.append('acronym', acronym)
  }
  if (degreeId) {
    url.searchParams.append('degreeId', degreeId.toString())
  }
  if (faculty) {
    url.searchParams.append('faculty', faculty)
  }
  if (degree) {
    url.searchParams.append('degree', degree)
  }
  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error('Failed to fetch courses')
  }
  return response.json()
}

export async function getCourse(id: number): Promise<CourseDetail> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch course')
  }
  return response.json()
}

export async function getCourseFeedback(id: number): Promise<Feedback[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}/feedback`)
  if (!response.ok) {
    throw new Error('Failed to fetch course feedback')
  }
  return response.json()
}

export async function getCourseIdFromAcronym(
  degreeId: number,
  acronym: string
): Promise<number> {
  const courses = await getCourses({ acronym, degreeId })
  if (courses.length === 0) {
    throw new Error('Course not found')
  } else if (courses.length > 1) {
    console.warn('Multiple courses found for acronym', acronym)
    // throw new Error('Multiple courses found for acronym')
  }
  return courses[0].id
}

export async function searchCourses(
  params: SearchCoursesParams
): Promise<CourseSearchResponse> {
  // Validate at least one param exists
  if (!params.q && !params.faculty_id && !params.degree_id) {
    throw new Error('At least one search parameter required')
  }

  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')

  return apiGet<CourseSearchResponse>(`/courses/search?${queryString}`)
}
