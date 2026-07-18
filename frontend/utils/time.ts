/**
 * Format a date (ISO string or Date) as a short relative time.
 * Examples: "Just now", "2m ago", "3h ago", "2d ago".
 */
export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return ''
  const date = typeof input === 'string' ? new Date(input) : input
  const now = Date.now()
  const diff = Math.max(0, now - date.getTime())
  const seconds = Math.floor(diff / 1000)
  if (seconds < 30) return 'Just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

/**
 * Format a date in MM-DD for chart axes.
 */
export function formatChartDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${month}-${day}`
}

/**
 * Safely extract hostname from a URL, stripping the leading "www.".
 */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}