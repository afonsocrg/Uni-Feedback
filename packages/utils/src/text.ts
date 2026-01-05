/**
 * Count the number of words in a text string.
 * Uses simple whitespace splitting.
 *
 * @param text - The text to count words in (can be null or undefined)
 * @returns The number of words in the text
 */
export function countWords(text: string | null | undefined): number {
  if (!text) {
    return 0
  }

  return text.trim().split(/\s+/).length
}

export function initCap(text: string): string {
  if (text.length === 0) return text
  return text.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
    return m.toUpperCase()
  })
}
