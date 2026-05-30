import {
  type Degree,
  type Faculty,
  type FacultyDetails,
  type FacultySearchResponse,
  type SearchFacultiesParams
} from './types'
import { apiGet } from './utils'

export async function getFaculties(): Promise<Faculty[]> {
  return apiGet<Faculty[]>('/faculties', { requiresAuth: false })
}

export async function getFacultyDetails(
  facultyId: number
): Promise<FacultyDetails> {
  return apiGet<FacultyDetails>(`/admin/faculties/${facultyId}`)
}

export async function getFacultyDegrees(facultyId: number): Promise<Degree[]> {
  return apiGet<Degree[]>(`/faculties/${facultyId}/degrees`, {
    requiresAuth: false
  })
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
