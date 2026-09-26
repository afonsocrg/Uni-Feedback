/** Micro-euros to a euro string. Costs are summed as integers and only ever formatted here. */
export function formatCost(micros: number | null | undefined): string {
  if (micros === null || micros === undefined) return '–'
  const euros = micros / 1_000_000
  if (euros === 0) return '€0'
  if (euros < 0.01) return `€${euros.toFixed(4)}`
  return `€${euros.toFixed(2)}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '–'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

export function formatPercent(part: number, whole: number): string {
  if (!whole) return '–'
  return `${((part / whole) * 100).toFixed(1)}%`
}

export function truncate(text: string | null | undefined, max = 90): string {
  if (!text) return ''
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine
}
