import { database } from '@uni-feedback/db'
import { faculties } from '@uni-feedback/db/schema'
import { isNotNull } from 'drizzle-orm'

/**
 * Validates if email domain is in the university whitelist
 * Returns true if valid, false otherwise
 */
export async function isUniversityEmail(email: string): Promise<boolean> {
  const emailDomain = email.toLowerCase().split('@')[1]

  if (!emailDomain) {
    return false
  }

  // Get all faculties with email suffixes
  const allFaculties = await database()
    .select()
    .from(faculties)
    .where(isNotNull(faculties.emailSuffixes))

  for (const faculty of allFaculties) {
    if (faculty.emailSuffixes && Array.isArray(faculty.emailSuffixes)) {
      const emailSuffixes = faculty.emailSuffixes as string[]
      if (
        emailSuffixes.some(
          (suffix: string) => emailDomain === suffix.toLowerCase()
        )
      ) {
        return true
      }
    }
  }

  return false
}

/**
 * Get list of all valid university email domains
 */
export async function getValidEmailDomains(): Promise<string[]> {
  const allFaculties = await database()
    .select()
    .from(faculties)
    .where(isNotNull(faculties.emailSuffixes))

  const domains = new Set<string>()

  for (const faculty of allFaculties) {
    if (faculty.emailSuffixes && Array.isArray(faculty.emailSuffixes)) {
      const emailSuffixes = faculty.emailSuffixes as string[]
      emailSuffixes.forEach((suffix: string) => {
        domains.add(suffix.toLowerCase())
      })
    }
  }

  return Array.from(domains)
}
