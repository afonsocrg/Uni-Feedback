import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { openWhatsapp } from '~/utils'

export interface NativeShareInput {
  title?: string
  text: string
}

export interface ReferralShare {
  /** The shareable `/login?ref=CODE` link, or null when there's no code yet
   * (or during SSR before `window` exists). */
  referralUrl: string | null
  /** True briefly after a successful copy, for swapping the copy icon. */
  copied: boolean
  /** Whether the OS-native share sheet (navigator.share) is available. Only
   * true on supporting devices, typically mobile. */
  canNativeShare: boolean
  /** Copies the referral link to the clipboard. Resolves to `true` on success
   * so callers can track copy completion (copy can silently fail). */
  copyLink: () => Promise<boolean>
  /** Opens WhatsApp with the given pre-written message. */
  shareWhatsApp: (message: string) => void
  /** Opens the OS share sheet with the given text (the referral link is
   * attached as the shared URL). */
  nativeShare: (input: NativeShareInput) => Promise<void>
}

/**
 * Centralizes the referral-share *mechanics* (link building, opening WhatsApp,
 * the native share sheet, clipboard copy + toasts). It is message-agnostic:
 * `shareWhatsApp`/`nativeShare` take the text to send, so each caller controls
 * its own copy. Only the copy-toast strings (`profile.toast_referral_*`) live here.
 */
export function useReferralShare(referralCode: string | null): ReferralShare {
  const { t } = useTranslation('feedback')
  const [copied, setCopied] = useState(false)

  // Guard `window` so the hook is safe if a component using it is ever
  // server-rendered (e.g. the dev `?preview=success` escape hatch loaded directly).
  const referralUrl =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/login?ref=${referralCode}`
      : null

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copyLink = async () => {
    if (!referralUrl) return false
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success(t('profile.toast_referral_copied'))
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch {
      toast.error(t('profile.toast_referral_failed'))
      return false
    }
  }

  const shareWhatsApp = (message: string) => {
    // Opens the WhatsApp app directly (mobile) / WhatsApp Web (desktop).
    openWhatsapp({ text: message })
  }

  const nativeShare = async ({ title, text }: NativeShareInput) => {
    if (!canNativeShare) return
    try {
      await navigator.share({ title, text, url: referralUrl ?? undefined })
    } catch {
      // User dismissed the share sheet, or it failed. Nothing to do.
    }
  }

  return {
    referralUrl,
    copied,
    canNativeShare,
    copyLink,
    shareWhatsApp,
    nativeShare
  }
}
