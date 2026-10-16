import { apiDelete, apiGet, apiPost, apiPut } from './utils'

/**
 * "O meu percurso": the degrees a student takes or took.
 *
 * School years are start years, the same encoding as feedback: 2025 means
 * 2025/2026. `endSchoolYear` null means ongoing or unknown.
 */
export interface JourneyDegree {
  /** Null for the inferred guess, which is not stored until confirmed. */
  id: number | null
  degreeId: number
  degreeName: string
  degreeAcronym: string
  degreeType: string
  facultyId: number
  facultyName: string
  facultyShortName: string
  facultyLogo: string | null
  startSchoolYear: number | null
  endSchoolYear: number | null
}

export interface JourneyResponse {
  /** Declared degrees, current first. */
  degrees: JourneyDegree[]
  /** One guess from their reviews, offered once and only while `degrees` is empty. */
  inferred: JourneyDegree | null
}

export interface JourneyDegreeInput {
  degreeId: number
  startSchoolYear: number | null
  endSchoolYear: number | null
}

export async function getJourney(): Promise<JourneyResponse> {
  return apiGet<JourneyResponse>('/profile/journey')
}

/** Also how the inferred guess is confirmed. */
export async function addJourneyDegree(
  input: JourneyDegreeInput
): Promise<{ degree: JourneyDegree }> {
  return apiPost('/profile/journey/degrees', input)
}

export async function updateJourneyDegree(
  id: number,
  input: JourneyDegreeInput
): Promise<{ degree: JourneyDegree }> {
  return apiPut(`/profile/journey/degrees/${id}`, input)
}

export async function removeJourneyDegree(
  id: number
): Promise<{ message: string }> {
  return apiDelete(`/profile/journey/degrees/${id}`)
}

/** "Não é o meu curso": the guess is never offered again. */
export async function dismissInferredDegree(): Promise<{ message: string }> {
  return apiPost('/profile/journey/inferred/dismiss')
}
