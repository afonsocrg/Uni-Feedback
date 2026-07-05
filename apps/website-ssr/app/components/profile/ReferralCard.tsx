import { useTranslation } from 'react-i18next'
import { ReferralShareButtons } from '../referral/ReferralShareButtons'

/** Invite-a-friend section on the profile: heading + the shared share buttons
 * (WhatsApp primary, Copy, and Share where available). */
export function ReferralCard({
  referralCode
}: {
  referralCode: string | null
}) {
  const { t } = useTranslation('feedback')

  if (!referralCode) return null

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{t('profile.referral_title')}</p>
        <p className="text-xs text-muted-foreground">
          {t('profile.referral_desc')}
        </p>
      </div>
      <ReferralShareButtons referralCode={referralCode} surface="profile" />
    </div>
  )
}
