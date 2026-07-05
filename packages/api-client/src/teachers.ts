import { type SearchTeachersParams, type TeacherSearchResponse } from './types'
import { apiGet } from './utils'

export async function searchTeachers(
  params: SearchTeachersParams
): Promise<TeacherSearchResponse> {
  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')

  return apiGet<TeacherSearchResponse>(
    `/teachers/search${queryString ? `?${queryString}` : ''}`,
    { requiresAuth: false }
  )
}
