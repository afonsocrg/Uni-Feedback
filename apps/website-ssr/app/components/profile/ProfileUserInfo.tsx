import type { UserStatsResponse } from '@uni-feedback/api-client'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator
} from '@uni-feedback/ui'
import { HelpCircle, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { getLocalePath } from '~/utils/i18n-routes'

type ProfileStats = UserStatsResponse['stats']

/** Avatar, email, total points and the per-source point breakdown. */
export function ProfileUserInfo({
  email,
  stats,
  isStatsLoading
}: {
  email: string
  stats: ProfileStats | undefined
  isStatsLoading: boolean
}) {
  const { t } = useTranslation('feedback')
  const lang = useLang()

  return (
    <div className="space-y-6">
      {/* User Avatar & Email with Total Points */}
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="size-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="truncate text-sm font-medium text-foreground"
            title={email}
          >
            {email}
          </p>
          {isStatsLoading ? (
            <p className="text-sm text-muted-foreground">
              {t('profile.loading_stats')}
            </p>
          ) : stats ? (
            <p className="text-2xl font-bold text-primaryBlue flex items-center gap-1">
              {stats.totalPoints}{' '}
              <span className="text-sm text-muted-foreground font-normal">
                {t('profile.points')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="cursor-pointer"
                    aria-label={t('profile.how_points_work')}
                  >
                    <HelpCircle className="size-4 text-muted-foreground hover:text-primary transition-colors" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 text-sm">
                  <p className="font-medium mb-2">
                    {t('profile.how_points_work')}
                  </p>
                  <p className="text-muted-foreground mb-3">
                    {t('profile.points_desc')}
                  </p>
                  <Link
                    to={getLocalePath('points', lang)}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    {t('profile.learn_more')}
                  </Link>
                </PopoverContent>
              </Popover>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('profile.stats_failed')}
            </p>
          )}
        </div>
      </div>

      {/* Point Breakdown */}
      {stats && (
        <div className="space-y-2 text-sm">
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t('profile.feedback_count', {
                count: stats.feedbackCount
              })}
            </span>
            <span className="font-medium">
              {stats.feedbackPoints} {t('profile.pts')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t('profile.referral_count', {
                count: stats.referralCount
              })}
            </span>
            <span className="font-medium">
              {stats.referralPoints} {t('profile.pts')}
            </span>
          </div>
          {stats.bonusPoints > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('profile.bonus_points')}
              </span>
              <span className="font-medium">
                {stats.bonusPoints} {t('profile.pts')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
