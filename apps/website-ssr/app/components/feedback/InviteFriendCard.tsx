import { Card } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { ReferralShareButtons } from '../referral/ReferralShareButtons'

/**
 * Invite-a-friend CTA shown on the feedback success screen, at the moment of
 * peak goodwill. Wraps the shared share buttons with a heading; WhatsApp is the
 * primary action (that's where students are).
 */
export function InviteFriendCard({
  referralCode
}: {
  referralCode: string | null
}) {
  const { t } = useTranslation('feedback')

  // No code (e.g. anonymous submit) means nothing to share.
  if (!referralCode) return null

  return (
    <Card className="space-y-3 border-primaryBlue/20 bg-card p-4 shadow-sm">
      <div className="space-y-0.5 text-center">
        <h3 className="text-base font-semibold text-foreground">
          {t('success.invite_title')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('success.invite_desc')}
        </p>
      </div>

      <ReferralShareButtons
        referralCode={referralCode}
        surface="feedback_success"
      />
    </Card>
  )
}
