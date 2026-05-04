import { API_BASE_URL } from './config'
import {
  type Course,
  type DegreeSearchResponse,
  type SearchDegreesParams
} from './types'
import { apiGet } from './utils'

export async function getDegreeCourses(degreeId: number): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses?degreeId=${degreeId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch degree courses')
  }
  return response.json()
}

export async function searchDegrees(
  params: SearchDegreesParams
): Promise<DegreeSearchResponse> {
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')

  return apiGet<DegreeSearchResponse>(
    `/degrees/search${queryString ? `?${queryString}` : ''}`,
    { requiresAuth: false }
  )
}
