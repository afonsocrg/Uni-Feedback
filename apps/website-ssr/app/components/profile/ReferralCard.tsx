import { Button, Input } from '@uni-feedback/ui'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/** Read-only referral link with a copy-to-clipboard button. */
export function ReferralCard({
  referralCode
}: {
  referralCode: string | null
}) {
  const { t } = useTranslation('feedback')
  const [copied, setCopied] = useState(false)

  if (!referralCode) return null

  const referralUrl = `${window.location.origin}/login?ref=${referralCode}`

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast.success(t('profile.toast_referral_copied'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('profile.toast_referral_failed'))
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-1">
        {t('profile.referral_title')}
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        {t('profile.referral_desc')}
      </p>
      <div className="relative">
        <Input
          value={referralUrl}
          readOnly
          className="pr-10 text-sm bg-background"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="absolute right-1 top-1/2 -translate-y-1/2 size-8"
          title={t('profile.copy_referral')}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  )
}
