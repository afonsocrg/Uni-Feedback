import { randomBytes } from 'crypto'
import { PASSWORD_REGEX, PASSWORD_REQUIREMENTS } from '@config/auth'

/**
 * Validates password against security requirements
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`
    )
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (
    PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL_CHAR &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push('Password must contain at least one special character')
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generates a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Hashes a password using a secure algorithm
 */
export async function hashPassword(password: string): Promise<string> {
  // Using Web Crypto API which is available in Cloudflare Workers
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // Generate salt
  const salt = randomBytes(16)
  const saltedPassword = new Uint8Array(salt.length + data.length)
  saltedPassword.set(salt)
  saltedPassword.set(data, salt.length)

  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword)
  const hashArray = new Uint8Array(hashBuffer)

  // Combine salt and hash
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)

  // Convert to hex
  return Array.from(combined)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Hashes a token using SHA-256 (for high-entropy tokens)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = new Uint8Array(hashBuffer)
  
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verifies a password against its hash
 */
export async function verifyHash(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const passwordData = encoder.encode(password)

    // Extract salt (first 32 characters = 16 bytes)
    const salt = new Uint8Array(
      hash
        .slice(0, 32)
        .match(/.{2}/g)!
        .map((byte) => parseInt(byte, 16))
    )

    // Extract stored hash (remaining characters)
    const storedHash = hash.slice(32)

    // Create salted password
    const saltedPassword = new Uint8Array(salt.length + passwordData.length)
    saltedPassword.set(salt)
    saltedPassword.set(passwordData, salt.length)

    // Hash with SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword)
    const hashArray = new Uint8Array(hashBuffer)

    // Convert to hex
    const computedHash = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return computedHash === storedHash
  } catch (error) {
    return false
  }
}
