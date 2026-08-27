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
 * Resolve the faculty an email belongs to, by suffix.
 *
 * Today the login email IS the proof of affiliation, so this is how we know
 * which university a student is at. That coupling is what the identity rework
 * exists to break (afonsocrg/prds/2026-08-09_identity_and_affiliation.md); when
 * it lands, this should read from the affiliation table instead.
 */
export async function findFacultyByEmail(email: string) {
  const emailDomain = email.toLowerCase().split('@')[1]
  if (!emailDomain) return null

  const allFaculties = await database()
    .select()
    .from(faculties)
    .where(isNotNull(faculties.emailSuffixes))

  for (const faculty of allFaculties) {
    const suffixes = faculty.emailSuffixes
    if (Array.isArray(suffixes)) {
      if (
        (suffixes as string[]).some(
          (suffix) => emailDomain === suffix.toLowerCase()
        )
      ) {
        return faculty
      }
    }
  }

  return null
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
