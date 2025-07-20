export interface EmailMaskingOptions {
  /** Number of characters to show at the start of the local part (default: 1) */
  showStart?: number
  /** Number of characters to show at the end of the local part (default: 0) */
  showEnd?: number
  /** Character to use for masking (default: '*') */
  maskChar?: string
  /** Whether to mask the domain (default: false) */
  maskDomain?: boolean
  /** Number of characters to show at start of domain if masking domain (default: 1) */
  domainShowStart?: number
}

/**
 * Masks an email address to protect privacy while keeping it partially readable
 *
 * @param email - The email address to mask
 * @param options - Masking configuration options
 *
 * Examples:
 * - maskEmail('john.doe@example.com') -> 'j*******@example.com'
 * - maskEmail('john.doe@example.com', { showStart: 2, showEnd: 1 }) -> 'jo*****e@example.com'
 * - maskEmail('john.doe@example.com', { showStart: 3, maskDomain: true }) -> 'joh*****@e*********'
 * - maskEmail('a@test.com', { showStart: 1 }) -> 'a@test.com' (too short to mask)
 */
export function maskEmail(
  email: string,
  options: EmailMaskingOptions = {}
): string {
  const {
    showStart = 1,
    showEnd = 0,
    maskChar = '*',
    maskDomain = false,
    domainShowStart = 1
  } = options

  if (!email || typeof email !== 'string') {
    return maskChar.repeat(3)
  }

  const atIndex = email.indexOf('@')
  if (atIndex === -1) {
    // Invalid email format, mask everything except specified characters
    if (email.length <= showStart + showEnd) {
      return email // Too short to mask meaningfully
    }
    const start = email.substring(0, showStart)
    const end = showEnd > 0 ? email.substring(email.length - showEnd) : ''
    const maskLength = Math.max(1, email.length - showStart - showEnd)
    return start + maskChar.repeat(maskLength) + end
  }

  const localPart = email.substring(0, atIndex)
  const domain = email.substring(atIndex + 1) // Remove the '@'

  // Mask local part
  let maskedLocal: string
  if (localPart.length <= showStart + showEnd) {
    // Too short to mask meaningfully
    maskedLocal = localPart
  } else {
    const start = localPart.substring(0, showStart)
    const end =
      showEnd > 0 ? localPart.substring(localPart.length - showEnd) : ''
    const maskLength = Math.max(1, localPart.length - showStart - showEnd)
    maskedLocal = start + maskChar.repeat(maskLength) + end
  }

  // Handle domain
  let finalDomain: string
  if (maskDomain && domain.length > domainShowStart) {
    const domainStart = domain.substring(0, domainShowStart)
    const domainMaskLength = Math.max(1, domain.length - domainShowStart)
    finalDomain = domainStart + maskChar.repeat(domainMaskLength)
  } else {
    finalDomain = domain
  }

  return maskedLocal + '@' + finalDomain
}

/**
 * Masks multiple emails in an array
 */
export function maskEmails(
  emails: string[],
  options?: EmailMaskingOptions
): string[] {
  return emails.map((email) => maskEmail(email, options))
}
