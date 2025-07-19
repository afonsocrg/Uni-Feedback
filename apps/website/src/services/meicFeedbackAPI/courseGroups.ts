import { API_BASE_URL } from './config'
import { CourseGroup } from './types'

export async function getCourseGroups(
  degreeId: number
): Promise<CourseGroup[]> {
  const response = await fetch(
    `${API_BASE_URL}/degrees/${degreeId}/courseGroups`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch course groups')
  }
  return response.json()
}
