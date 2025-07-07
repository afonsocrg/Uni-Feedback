/**
 * Converts a faculty short_name to a URL-safe slug
 * e.g., "Nova SBE" → "nova-sbe"
 */
export function facultyToSlug(shortName: string): string {
  return shortName.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Converts a URL slug back to match faculty short_name for lookup
 * e.g., "nova-sbe" → matches faculty with short_name "Nova SBE"
 */
export function slugToFaculty(slug: string, faculties: Array<{ short_name: string }>): any {
  return faculties.find(
    (f) => facultyToSlug(f.short_name) === slug.toLowerCase()
  )
}

/**
 * Converts a degree acronym to a URL-safe slug
 * e.g., "MEIC" → "meic"
 */
export function degreeToSlug(acronym: string): string {
  return acronym.toLowerCase()
}

/**
 * Converts a URL slug back to match degree acronym for lookup
 * e.g., "meic" → matches degree with acronym "MEIC"
 */
export function slugToDegree(slug: string, degrees: Array<{ acronym: string }>): any {
  return degrees.find(
    (d) => d.acronym.toLowerCase() === slug.toLowerCase()
  )
}

/**
 * Builds a URL path for a faculty
 */
export function buildFacultyUrl(faculty: { short_name: string }): string {
  return `/${facultyToSlug(faculty.short_name)}`
}

/**
 * Builds a URL path for a faculty + degree combination
 */
export function buildDegreeUrl(
  faculty: { short_name: string }, 
  degree: { acronym: string }
): string {
  return `/${facultyToSlug(faculty.short_name)}/${degreeToSlug(degree.acronym)}`
}