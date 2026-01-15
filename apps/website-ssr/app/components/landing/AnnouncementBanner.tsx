import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface AnnouncementBannerProps {
  bannerId: string
  children: React.ReactNode
  /** If set, the banner will reappear after this duration (in milliseconds) */
  showAgainAfterMs?: number
}

function getStorageKey(bannerId: string) {
  return `announcement-dismissed-${bannerId}`
}

function isDismissed(bannerId: string, showAgainAfterMs?: number): boolean {
  if (typeof window === 'undefined') return false

  const dismissedAt = localStorage.getItem(getStorageKey(bannerId))
  if (!dismissedAt) return false

  if (showAgainAfterMs) {
    const dismissedTime = parseInt(dismissedAt, 10)
    const now = Date.now()
    return now - dismissedTime < showAgainAfterMs
  }

  return true
}

export function AnnouncementBanner({
  bannerId,
  children,
  showAgainAfterMs
}: AnnouncementBannerProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check dismissal state on client side only
    const shouldShow = !isDismissed(bannerId, showAgainAfterMs)
    if (shouldShow) {
      setShouldRender(true)
      // Trigger animation after render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    }
  }, [bannerId, showAgainAfterMs])

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      localStorage.setItem(getStorageKey(bannerId), Date.now().toString())
      setIsAnimating(false)
      // Remove from DOM after transition
      setTimeout(() => setShouldRender(false), 300)
    },
    [bannerId]
  )

  if (!shouldRender) return null

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r from-[#1a5a7a] via-[#23729f] to-[#1a5a7a] transition-all duration-300 ease-out ${
        isAnimating
          ? 'max-h-20 opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-full'
      }`}
    >
      {/* Animated shine effect on the border */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 animate-[shine_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" />
      </div>

      {/* Top metallic highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Bottom metallic shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent" />

      <div className="relative flex items-center justify-center py-2 pl-4 pr-10">
        <div className="text-center text-sm font-medium text-white/95">
          {children}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-2 p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          aria-label="Dismiss announcement"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
