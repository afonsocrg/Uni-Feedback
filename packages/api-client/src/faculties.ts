import { API_BASE_URL } from './config'
import {
  type Degree,
  type Faculty,
  type FacultyDetails,
  type FacultySearchResponse,
  type SearchFacultiesParams
} from './types'
import { apiGet } from './utils'

export async function getFaculties(): Promise<Faculty[]> {
  const response = await fetch(`${API_BASE_URL}/faculties`)
  if (!response.ok) {
    throw new Error('Failed to fetch faculties')
  }
  return response.json()
}

export async function getFacultyDetails(
  facultyId: number
): Promise<FacultyDetails> {
  const response = await fetch(`${API_BASE_URL}/admin/faculties/${facultyId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch faculty details')
  }
  return response.json()
}

export async function getFacultyDegrees(facultyId: number): Promise<Degree[]> {
  const response = await fetch(`${API_BASE_URL}/faculties/${facultyId}/degrees`)
  if (!response.ok) {
    throw new Error('Failed to fetch faculty degrees')
  }
  return response.json()
}

export async function searchFaculties(
  params: SearchFacultiesParams
): Promise<FacultySearchResponse> {
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')

  return apiGet<FacultySearchResponse>(
    `/faculties/search${queryString ? `?${queryString}` : ''}`,
    { requiresAuth: false }
  )
}
