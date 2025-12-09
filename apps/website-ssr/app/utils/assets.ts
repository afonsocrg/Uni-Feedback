/**
 * Get the full URL for an asset stored in R2/CDN
 */
export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null

  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://cdn.uni-feedback.com'
  return `${cdnUrl}/${path}`
}
