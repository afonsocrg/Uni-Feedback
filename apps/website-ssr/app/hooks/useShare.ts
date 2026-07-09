import { useState } from 'react'
import { toast } from 'sonner'
import { openWhatsapp } from '~/utils'

export interface NativeShareInput {
  title?: string
  text: string
}

export interface ShareToasts {
  /** Shown after the clipboard write resolves. */
  copied: string
  /** Shown when the clipboard write throws (permissions, insecure context). */
  failed: string
}

export interface Share {
  /** True briefly after a successful copy, for swapping the copy icon. */
  copied: boolean
  /** Whether the OS-native share sheet (navigator.share) is available. Only
   * true on supporting devices, typically mobile. */
  canNativeShare: boolean
  /** Copies `url` to the clipboard. Resolves to `true` on success so callers can
   * track copy completion (copy can silently fail). A null `url` is a no-op, so
   * callers don't have to guard SSR themselves. */
  copyLink: (url: string | null) => Promise<boolean>
  /** Opens WhatsApp with the given pre-written message. */
  shareWhatsApp: (message: string) => void
  /** Opens the OS share sheet with the given text and URL. */
  nativeShare: (
    input: NativeShareInput & { url: string | null }
  ) => Promise<void>
}

/**
 * The share *mechanics* for any URL: clipboard copy with toasts, WhatsApp, and
 * the OS-native share sheet. It holds no URL of its own, so a caller that tags
 * each channel differently (e.g. a distinct `utm_medium` per channel) can pass
 * the right URL per call. It is message-agnostic too: `shareWhatsApp` and
 * `nativeShare` take the text to send, so each caller controls its own copy.
 *
 * See [[useReferralShare]] for the referral-link flavour, which binds the
 * referral URL and its toast strings once.
 */
export function useShare(toasts: ShareToasts): Share {
  const [copied, setCopied] = useState(false)

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copyLink = async (url: string | null) => {
    if (!url) return false
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(toasts.copied)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch {
      toast.error(toasts.failed)
      return false
    }
  }

  const shareWhatsApp = (message: string) => {
    // Opens the WhatsApp app directly (mobile) / WhatsApp Web (desktop).
    openWhatsapp({ text: message })
  }

  const nativeShare = async ({
    title,
    text,
    url
  }: NativeShareInput & { url: string | null }) => {
    if (!canNativeShare) return
    try {
      await navigator.share({ title, text, url: url ?? undefined })
    } catch {
      // User dismissed the share sheet, or it failed. Nothing to do.
    }
  }

  return { copied, canNativeShare, copyLink, shareWhatsApp, nativeShare }
}
