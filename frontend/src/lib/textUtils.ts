export function getTruncatedText(text: string, limit: number): string {
  if (text.length <= limit) return text

  // Find the last complete word before the limit
  let truncateAt = limit
  while (truncateAt > 0 && text[truncateAt] !== ' ') {
    truncateAt--
  }

  // If no space found in reasonable distance, just use word boundary
  if (truncateAt < limit * 0.8) {
    truncateAt = limit
    while (truncateAt > 0 && /\w/.test(text[truncateAt])) {
      truncateAt--
    }
  }

  let truncated = text.substring(0, truncateAt).trim()

  // More comprehensive markdown syntax protection
  // Check for unmatched markdown pairs that would break rendering
  const boldCount = (truncated.match(/\*\*/g) || []).length
  const italicCount = (truncated.match(/(?<!\*)\*(?!\*)/g) || []).length
  const codeCount = (truncated.match(/`/g) || []).length
  const linkBracketCount = (truncated.match(/\[/g) || []).length
  const linkBracketCloseCount = (truncated.match(/\]/g) || []).length

  // If we have unmatched pairs, try to find a safer cut point
  if (
    boldCount % 2 !== 0 ||
    italicCount % 2 !== 0 ||
    codeCount % 2 !== 0 ||
    linkBracketCount !== linkBracketCloseCount
  ) {
    // Go backwards to find the last complete sentence or paragraph
    const sentences = truncated.split(/[.!?]\s+/)
    if (sentences.length > 1) {
      // Remove the last incomplete sentence
      sentences.pop()
      truncated = sentences.join('. ')
      if (truncated && !truncated.endsWith('.')) {
        truncated += '.'
      }
    } else {
      // If no sentence breaks, try paragraph breaks
      const paragraphs = truncated.split(/\n\s*\n/)
      if (paragraphs.length > 1) {
        paragraphs.pop()
        truncated = paragraphs.join('\n\n')
      } else {
        // Last resort: cut at a much safer point
        truncated = truncated.substring(0, Math.floor(truncateAt * 0.7)).trim()
        // Remove any trailing incomplete markdown
        truncated = truncated.replace(/[*#`\[]+$/, '').trim()
      }
    }
  }

  return truncated
}
