/**
 * Normalize and validate an Instagram handle.
 *
 * - Trims whitespace and strips a single leading "@".
 * - Lowercases (Instagram handles are case-insensitive).
 * - Enforces Instagram's rules: 1-30 chars of [a-z0-9._], no leading/trailing
 *   dot, no consecutive dots.
 *
 * @param input - Raw handle provided by the user.
 * @returns The normalized handle, or null if the input is invalid.
 */
export function normalizeInstagramHandle(input: unknown): string | null {
  if (typeof input !== 'string') return null

  let handle = input.trim()
  if (handle.startsWith('@')) {
    handle = handle.slice(1)
  }
  handle = handle.toLowerCase()

  if (!/^[a-z0-9._]{1,30}$/.test(handle)) return null
  if (handle.startsWith('.') || handle.endsWith('.')) return null
  if (handle.includes('..')) return null

  return handle
}
