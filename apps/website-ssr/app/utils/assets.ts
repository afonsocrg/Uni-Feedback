/**
 * Get the full URL for an asset stored in R2/CDN
 */
export function getAssetUrl(path: string): string {
  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://cdn.uni-feedback.com'
  return `${cdnUrl}/${path}`
}
