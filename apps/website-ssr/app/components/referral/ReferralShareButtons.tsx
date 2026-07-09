import { Button } from '@uni-feedback/ui'
import { isGiveawayActive } from '@uni-feedback/utils'
import { Check, Copy, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FaWhatsapp } from 'react-icons/fa'
import { useReferralShare } from '~/hooks'
import { analytics, type ReferralSurface } from '~/utils/analytics'

/**
 * The standard referral share buttons (WhatsApp primary + one compact
 * secondary), shared by every invite surface so they stay identical. The copy
 * is built HERE and handed as plain text to the message-agnostic
 * useReferralShare functions. While the giveaway is live the friend-facing copy
 * leads with the €50 hook; otherwise it uses an evergreen product-value message.
 *
 * `surface` identifies where these buttons are rendered so the referral funnel
 * can be broken down by origin (feedback success / profile / giveaway).
 */
export function ReferralShareButtons({
  referralCode,
  surface
}: {
  referralCode: string | null
  surface: ReferralSurface
}) {
  const { t } = useTranslation('feedback')
  const {
    referralUrl,
    copied,
    canNativeShare,
    copyLink,
    shareWhatsApp,
    nativeShare
  } = useReferralShare(referralCode)

  if (!referralUrl) return null

  const giveawayActive = isGiveawayActive()

  const whatsappMessage = t(
    giveawayActive
      ? 'share.whatsapp_message_giveaway'
      : 'share.whatsapp_message',
    { link: referralUrl }
  )
  const nativeText = t(
    giveawayActive ? 'share.native_text_giveaway' : 'share.native_text'
  )

  const handleWhatsApp = () => {
    analytics.referral.shareClicked({
      channel: 'whatsapp',
      surface,
      giveawayActive
    })
    shareWhatsApp(whatsappMessage)
  }

  const handleCopy = async () => {
    analytics.referral.shareClicked({
      channel: 'copy_url',
      surface,
      giveawayActive
    })
    const ok = await copyLink()
    if (ok) analytics.referral.linkCopied({ surface, giveawayActive })
  }

  const handleNativeShare = () => {
    analytics.referral.shareClicked({
      channel: 'native',
      surface,
      giveawayActive
    })
    nativeShare({ title: t('share.native_title'), text: nativeText })
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleWhatsApp}
        className="min-w-0 flex-1 gap-2 bg-whatsapp text-white hover:bg-whatsapp-hover"
      >
        <FaWhatsapp className="size-4 flex-none" />
        <span className="truncate">{t('success.invite_whatsapp')}</span>
      </Button>

      {/* Copy is the reliable, always-available direct action. The OS share
          sheet is an extra utility only where navigator.share exists (mobile). */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        title={t('success.invite_copy')}
        aria-label={t('success.invite_copy')}
        className="flex-shrink-0"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </Button>

      {canNativeShare && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleNativeShare}
          title={t('success.invite_share')}
          aria-label={t('success.invite_share')}
          className="flex-shrink-0"
        >
          <Share2 className="size-4" />
        </Button>
      )}
    </div>
  )
}
