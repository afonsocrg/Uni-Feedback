interface Faculty {
  id: number
  name: string
  shortName: string
  url: string
  emailSuffixes: string
}

interface Degree {
  id: number
  acronym: string
  name: string
}

/**
 * Converts a faculty shortName to a URL-safe slug
 * @param shortName - The faculty short name (e.g., "Nova SBE")
 * @returns URL-safe slug (e.g., "nova-sbe")
 */
export function facultyToSlug(shortName: string): string {
  return shortName.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Converts a URL slug back to match faculty shortName for lookup
 * @param slug - URL slug (e.g., "nova-sbe")
 * @param faculties - Array of faculty objects to search
 * @returns Matching faculty object or undefined
 */
export function slugToFaculty(
  slug: string,
  faculties: Faculty[]
): Faculty | undefined {
  return faculties.find(
    (f) => facultyToSlug(f.shortName) === slug.toLowerCase()
  )
}

/**
 * Converts a degree acronym to a URL-safe slug
 * @param acronym - The degree acronym (e.g., "MEIC")
 * @returns URL-safe slug (e.g., "meic")
 */
export function degreeToSlug(acronym: string): string {
  return acronym.toLowerCase()
}

/**
 * Converts a URL slug back to match degree acronym for lookup
 * @param slug - URL slug (e.g., "meic")
 * @param degrees - Array of degree objects to search
 * @returns Matching degree object or undefined
 */
export function slugToDegree(
  slug: string,
  degrees: Degree[]
): Degree | undefined {
  return degrees.find((d) => d.acronym.toLowerCase() === slug.toLowerCase())
}

/**
 * Builds a URL path for a faculty page
 * @param faculty - Faculty object
 * @returns URL path (e.g., "/nova-sbe")
 */
export function buildFacultyUrl(faculty: Faculty): string {
  return `/${facultyToSlug(faculty.shortName)}`
}

/**
 * Builds a URL path for a faculty + degree combination
 * @param faculty - Faculty object
 * @param degree - Degree object
 * @returns URL path (e.g., "/nova-sbe/mba")
 */
export function buildDegreeUrl(faculty: Faculty, degree: Degree): string {
  return `/${facultyToSlug(faculty.shortName)}/${degreeToSlug(degree.acronym)}`
}
