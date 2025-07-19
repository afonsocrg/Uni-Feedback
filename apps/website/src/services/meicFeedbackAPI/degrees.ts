import { API_BASE_URL } from './config'
import { type Course } from './types'

export async function getDegreeCourses(degreeId: number): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses?degreeId=${degreeId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch degree courses')
  }
  return response.json()
}
