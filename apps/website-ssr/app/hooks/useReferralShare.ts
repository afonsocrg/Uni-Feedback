import { useTranslation } from 'react-i18next'
import { useShare, type NativeShareInput, type Share } from './useShare'

export interface ReferralShare extends Omit<Share, 'copyLink' | 'nativeShare'> {
  /** The shareable `/login?ref=CODE` link, or null when there's no code yet
   * (or during SSR before `window` exists). */
  referralUrl: string | null
  /** Copies the referral link to the clipboard. Resolves to `true` on success
   * so callers can track copy completion (copy can silently fail). */
  copyLink: () => Promise<boolean>
  /** Opens the OS share sheet with the given text (the referral link is
   * attached as the shared URL). */
  nativeShare: (input: NativeShareInput) => Promise<void>
}

/**
 * The referral flavour of [[useShare]]: it builds the `/login?ref=CODE` link,
 * binds it to the share mechanics, and owns the referral copy-toast strings
 * (`profile.toast_referral_*`). Like the generic hook it is message-agnostic:
 * `shareWhatsApp`/`nativeShare` take the text to send, so each caller controls
 * its own copy.
 */
export function useReferralShare(referralCode: string | null): ReferralShare {
  const { t } = useTranslation('feedback')

  // Guard `window` so the hook is safe if a component using it is ever
  // server-rendered (e.g. the dev `?preview=success` escape hatch loaded directly).
  const referralUrl =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/login?ref=${referralCode}`
      : null

  const { copyLink, nativeShare, ...share } = useShare({
    copied: t('profile.toast_referral_copied'),
    failed: t('profile.toast_referral_failed')
  })

  return {
    ...share,
    referralUrl,
    copyLink: () => copyLink(referralUrl),
    nativeShare: (input: NativeShareInput) =>
      nativeShare({ ...input, url: referralUrl })
  }
}
