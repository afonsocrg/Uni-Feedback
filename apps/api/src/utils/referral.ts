import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { randomBytes } from 'crypto'
import { eq } from 'drizzle-orm'

// Exclude ambiguous characters (0, O, 1, I) for better user experience
const REFERRAL_CODE_CHARS = 'abcdefghjklmnpqrstuvwxyz23456789'
const DEFAULT_CODE_LENGTH = 8

/**
 * Generate a random referral code
 * @param length Length of the code (default: 8)
 * @returns Uppercase alphanumeric referral code
 */
export function generateReferralCode(
  length: number = DEFAULT_CODE_LENGTH
): string {
  const bytes = randomBytes(length)
  let code = ''
  for (let i = 0; i < length; i++) {
    code += REFERRAL_CODE_CHARS[bytes[i] % REFERRAL_CODE_CHARS.length]
  }
  return code
}

/**
 * Generate a unique referral code with collision detection
 * @param maxAttempts Maximum number of attempts before failing (default: 5)
 * @returns Unique referral code
 * @throws Error if unable to generate unique code after maxAttempts
 */
export async function generateUniqueReferralCode(
  maxAttempts: number = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode()

    // Check if code already exists
    const [existing] = await database()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1)

    if (!existing) {
      return code
    }
  }

  throw new Error(
    'Failed to generate unique referral code after multiple attempts'
  )
}

/**
 * Validate referral code format
 * @param code Referral code to validate
 * @returns True if format is valid (6-8 lowercase alphanumeric characters)
 */
export function validateReferralCodeFormat(code: string): boolean {
  return /^[a-z0-9]{6,8}$/.test(code)
}

/**
 * Find user by referral code
 * @param code Referral code to lookup
 * @returns User object with id, or null if not found
 */
export async function findUserByReferralCode(
  code: string
): Promise<{ id: number } | null> {
  const [user] = await database()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.referralCode, code))
    .limit(1)

  return user || null
}
