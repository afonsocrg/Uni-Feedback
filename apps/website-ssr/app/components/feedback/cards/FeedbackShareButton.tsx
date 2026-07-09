import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import { Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaWhatsapp } from 'react-icons/fa'
import { useShare } from '~/hooks'
import { addUtmParams } from '~/utils'
import { analytics, type ShareChannel } from '~/utils/analytics'

/**
 * Shares a permalink to a single review, via a popover offering WhatsApp, copy,
 * and (where the OS provides it) the native share sheet.
 *
 * Every link is tagged `utm_source=feedback_permalink` plus a per-channel
 * `utm_medium`, so PostHog can attribute the landings back to this surface and
 * split them by channel. Note that this identifies the *channel*, not the
 * sharer: a permalink is a pointer to a comment, not a referral link.
 */
export function FeedbackShareButton({
  feedbackId,
  courseId
}: {
  feedbackId: number
  courseId: number
}) {
  const { t } = useTranslation('course')
  const [open, setOpen] = useState(false)
  // `copied` is unused: the popover closes on copy, so the toast is the only
  // confirmation the student ever sees.
  const { canNativeShare, copyLink, shareWhatsApp, nativeShare } = useShare({
    copied: t('card.share.toast_copied'),
    failed: t('card.share.toast_failed')
  })

  // Built per channel so each carries its own utm_medium. Null during SSR,
  // which useShare treats as a no-op.
  //
  // The path comes from the current location rather than being rebuilt as
  // `/courses/{id}`: this card only ever renders on the course page, and the
  // unlocalized path 301s to `/en/courses/{id}`, which both drops the query
  // string (losing the UTM tags) and lands a Portuguese reader on the English
  // page. Only origin + pathname are read, never `location.search`, so an
  // inbound `?utm_*` from the visit that brought this student here can't leak
  // into what they share (addUtmParams merges into a query, it doesn't clear it).
  const permalink = (channel: ShareChannel) =>
    typeof window === 'undefined'
      ? null
      : addUtmParams(
          `${window.location.origin}${window.location.pathname}#feedback-${feedbackId}`,
          channel,
          'feedback_permalink'
        )

  const track = (channel: ShareChannel) =>
    analytics.feedback.shareClicked({ feedbackId, courseId, channel })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) analytics.feedback.sharePopoverOpened({ feedbackId, courseId })
  }

  const handleWhatsApp = () => {
    track('whatsapp')
    shareWhatsApp(
      t('card.share.whatsapp_message', { link: permalink('whatsapp') })
    )
    setOpen(false)
  }

  const handleCopy = async () => {
    track('copy_url')
    const ok = await copyLink(permalink('copy_url'))
    if (ok) analytics.feedback.linkCopied({ feedbackId, courseId })
    setOpen(false)
  }

  const handleNativeShare = async () => {
    track('native')
    setOpen(false)
    await nativeShare({
      title: t('card.share.native_title'),
      text: t('card.share.native_text'),
      url: permalink('native')
    })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title={t('card.share.label')}
          aria-label={t('card.share.label')}
          className="h-8 px-2 text-muted-foreground hover:text-muted-foreground"
        >
          <Share2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="flex flex-col gap-1">
          <Button popoverTrigger variant="ghost" onClick={handleWhatsApp}>
            <FaWhatsapp className="size-4" />
            WhatsApp
          </Button>
          <Button popoverTrigger variant="ghost" onClick={handleCopy}>
            <Copy className="size-4" />
            {t('card.share.copy')}
          </Button>
          {canNativeShare && (
            <Button popoverTrigger variant="ghost" onClick={handleNativeShare}>
              <Share2 className="size-4" />
              {t('card.share.native')}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
