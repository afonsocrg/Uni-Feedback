import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@uni-feedback/ui'
import {
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Pencil,
  Sparkles
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { useGiveawayDashboard, useProfileFeedback } from '~/hooks/queries'
import { getLocalePath } from '~/utils/i18n-routes'
import { ReferralShareButtons } from '../referral/ReferralShareButtons'
import { InstagramBonusCard } from './InstagramBonusCard'

/** School year (as stored in the DB) whose feedback counts toward the giveaway. */
const GIVEAWAY_SCHOOL_YEAR = 2025
/** Max points a single feedback can earn (base + all categories + bonus). */
const MAX_FEEDBACK_POINTS = 20
/** How many upgradeable reviews to show before the "show more" toggle. */
const UPGRADE_VISIBLE = 4

const CARD = 'flex flex-col rounded-xl border bg-card p-6 shadow-sm'

/** A small "?" trigger that opens a popover with contextual help. */
function HelpPopover({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">{children}</PopoverContent>
    </Popover>
  )
}

export function GiveawayTab({ referralCode }: { referralCode: string | null }) {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const [showAllUpgrades, setShowAllUpgrades] = useState(false)

  const { data, isLoading, isError } = useGiveawayDashboard()
  const { data: feedbackData } = useProfileFeedback()

  const pointsLink = (
    <Link
      to={getLocalePath('points', lang)}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
    >
      {t('profile.learn_more')}
    </Link>
  )

  const giveawayLink = (
    <Link
      to={getLocalePath('giveaway', lang)}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
    >
      {t('profile.learn_more')}
    </Link>
  )

  const referralLink = (
    <Link
      to={`${getLocalePath('giveaway-rules', lang)}#referrals`}
      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
    >
      {t('profile.learn_more')}
    </Link>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t('profile.giveaway.load_failed')}
        </p>
      </div>
    )
  }

  const { entries, referralCount, raffle, ambassador, boosts } = data.giveaway
  const pf = boosts.perfectFeedback
  const perfectPct = Math.min(
    100,
    Math.round((pf.current / pf.threshold) * 100)
  )
  const perfectEarned = pf.current >= pf.threshold

  // Approved feedback for giveaway-year courses — the pool the boost list works
  // from. `upgradeable` are the ones not yet at full points. Distinguishing an
  // empty pool (no feedback yet) from a fully-maxed one lets the boost section
  // show a "give feedback" CTA vs a congratulatory message.
  const giveawayFeedback = (feedbackData?.feedback ?? []).filter(
    (f) => f.schoolYear === GIVEAWAY_SCHOOL_YEAR && f.approvedAt !== null
  )
  const hasGiveawayFeedback = giveawayFeedback.length > 0
  const upgradeable = giveawayFeedback
    .filter((f) => (f.points ?? 0) < MAX_FEEDBACK_POINTS)
    .sort((a, b) => (a.points ?? 0) - (b.points ?? 0))
  const visibleUpgrades = showAllUpgrades
    ? upgradeable
    : upgradeable.slice(0, UPGRADE_VISIBLE)

  return (
    <div className="space-y-6">
      {/* Prizes — a short frame, then one block per prize that flows the award
          mechanism straight into the user's own standing for it. */}
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold">
          {t('profile.giveaway.prizes_title')}
        </h3>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {t('profile.giveaway.ends')}
        </p>
      </div>
      {/* One card per prize type: raffle (points) and top referrer (referrals) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Raffle points */}
        <div className={CARD}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primaryBlue/10 px-2.5 py-0.5 text-xs font-semibold text-primaryBlue">
                {t('profile.giveaway.prizes_raffle_tag')}
              </span>
              <span className="text-sm font-medium">
                {t('profile.giveaway.prizes_raffle_label')}
              </span>
            </div>
            <HelpPopover label={t('profile.giveaway.raffle_title')}>
              <p className="text-muted-foreground">
                {t('profile.giveaway.raffle_subtitle')}
              </p>
              {giveawayLink}
            </HelpPopover>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('profile.giveaway.prizes_raffle_desc')}
          </p>

          <p className="text-sm text-muted-foreground">
            {t('profile.giveaway.raffle_have')}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-primaryBlue tabular-nums">
              {entries}
            </span>
            <span className="text-lg text-muted-foreground">
              {t('profile.giveaway.points_word', { count: entries })}
            </span>
          </div>

          {/* Standing — its own row below the total, so it never feels crammed.
              The badge trails the plain-language explanation as a highlight. */}
          <div className="mt-4">
            {entries <= 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('profile.giveaway.raffle_zero')}
              </p>
            ) : raffle.topBand ? (
              <>
                <p className="text-sm text-muted-foreground">
                  <span className="mr-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 align-middle text-xs font-semibold capitalize text-green-700 dark:bg-green-500/15 dark:text-green-400">
                    {t(`profile.giveaway.band_label_${raffle.topBand}`)}
                  </span>
                  {t(`profile.giveaway.band_meaning_${raffle.topBand}`)}{' '}
                </p>
                {raffle.nextGoal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('profile.giveaway.next_goal', {
                      count: raffle.nextGoal.entriesNeeded,
                      band: t(
                        `profile.giveaway.band_label_${raffle.nextGoal.band}`
                      )
                    })}
                  </p>
                )}
              </>
            ) : raffle.nextGoal ? (
              <p className="text-sm text-muted-foreground">
                {t('profile.giveaway.next_goal', {
                  count: raffle.nextGoal.entriesNeeded,
                  band: t(`profile.giveaway.band_label_${raffle.nextGoal.band}`)
                })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('profile.giveaway.raffle_neutral')}
              </p>
            )}
          </div>
        </div>

        {/* Ambassador race */}
        <div className={CARD}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t('profile.giveaway.prizes_referral_tag')}
              </span>
              <span className="text-sm font-medium">
                {t('profile.giveaway.prizes_referral_label')}
              </span>
            </div>
            <HelpPopover label={t('profile.giveaway.prizes_referral_label')}>
              <p className="text-muted-foreground">
                {t('profile.giveaway.ambassador_help')}
              </p>
              {referralLink}
            </HelpPopover>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('profile.giveaway.prizes_referral_desc')}
          </p>

          {/* Hero = standing in the race, not the raw count (which is in the sub). */}
          <div className="flex items-baseline gap-2">
            {ambassador.state === 'leading' ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.giveaway.ambassador_hero_first_eyebrow')}
                </p>
                <span className="text-3xl font-bold text-amber-500">
                  {t('profile.giveaway.ambassador_hero_first')}
                </span>
              </div>
            ) : ambassador.state === 'tied' ? (
              <span className="text-3xl font-bold text-amber-500">
                {t('profile.giveaway.ambassador_hero_tied')}
              </span>
            ) : ambassador.state === 'contender' ? (
              <>
                <span className="text-5xl font-bold tabular-nums text-amber-500">
                  {ambassador.referralsToWin ?? 1}
                </span>
                <span className="text-lg text-muted-foreground">
                  {t('profile.giveaway.ambassador_hero_to_first')}
                </span>
              </>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('profile.giveaway.raffle_have')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold tabular-nums text-amber-500">
                    {referralCount}
                  </span>
                  <span className="text-lg text-muted-foreground">
                    {t('profile.giveaway.friends_word', {
                      count: referralCount
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            {ambassador.state === 'leading' &&
              t('profile.giveaway.ambassador_sub_leading', {
                count: referralCount,
                lead: ambassador.leadOverNext ?? 0
              })}
            {ambassador.state === 'tied' &&
              t('profile.giveaway.ambassador_sub_tied', {
                count: referralCount
              })}
            {ambassador.state === 'contender' &&
              t('profile.giveaway.ambassador_sub_count', {
                count: referralCount
              })}
            {ambassador.state === 'far' && t('profile.giveaway.ambassador_far')}
          </div>

          {ambassador.pendingReferrals > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              {t('profile.giveaway.ambassador_pending', {
                count: ambassador.pendingReferrals,
                points: ambassador.potentialPoints
              })}
            </div>
          )}

          {referralCode && (
            <div className="mt-auto pt-6">
              <ReferralShareButtons
                referralCode={referralCode}
                surface="giveaway"
              />
            </div>
          )}
        </div>
      </div>

      {/* Row 2 — Bonus cards (perfect-feedback + Instagram), before the boost list */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Perfect-feedback bonus with progress bar */}
        <div className={CARD}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <h4 className="font-medium">
                {t('profile.giveaway.perfect_title')}
              </h4>
              <HelpPopover label={t('profile.giveaway.perfect_title')}>
                <p className="text-muted-foreground">
                  {t('profile.giveaway.points_help')}
                </p>
                {pointsLink}
              </HelpPopover>
            </div>
            {perfectEarned && (
              <CheckCircle2 className="size-5 flex-shrink-0 text-green-500" />
            )}
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('profile.giveaway.perfect_desc', {
              threshold: pf.threshold,
              bonus: pf.bonus,
              max: MAX_FEEDBACK_POINTS
            })}
          </p>

          <div className="mt-auto">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-2 rounded-full transition-all ${
                  perfectEarned ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${perfectPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {perfectEarned
                ? t('profile.giveaway.perfect_unlocked', { bonus: pf.bonus })
                : t('profile.giveaway.perfect_progress', {
                    current: pf.current,
                    threshold: pf.threshold,
                    max: MAX_FEEDBACK_POINTS
                  })}
            </p>
          </div>
        </div>

        {/* Instagram — full link/unlink flow with a green check when linked */}
        <InstagramBonusCard />
      </div>

      {/* Boost — upgrade existing feedbacks (no surrounding card) */}
      <div>
        <div className="mb-4 flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="size-5" />
          </div>
          <h3 className="font-semibold">{t('profile.giveaway.boost_title')}</h3>
          <HelpPopover label={t('profile.giveaway.boost_title')}>
            <p className="text-muted-foreground">
              {t('profile.giveaway.points_help')}
            </p>
            {pointsLink}
          </HelpPopover>
        </div>

        {upgradeable.length > 0 ? (
          <div>
            <p className="text-sm font-medium">
              {t('profile.giveaway.upgrade_title', {
                count: upgradeable.length
              })}
            </p>
            <p className="mb-4 text-sm text-muted-foreground">
              {t('profile.giveaway.upgrade_desc')}
            </p>

            <div className="divide-y rounded-lg border">
              {visibleUpgrades.map((f) => (
                <Link
                  key={f.id}
                  to={getLocalePath('feedback-edit', lang).replace(
                    ':id',
                    String(f.id)
                  )}
                  className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="truncate text-sm">{f.courseName}</span>
                  <span className="flex flex-shrink-0 items-center gap-2.5">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {f.points ?? 0}/{MAX_FEEDBACK_POINTS}
                    </span>
                    <Pencil className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </span>
                </Link>
              ))}
            </div>

            {upgradeable.length > UPGRADE_VISIBLE && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowAllUpgrades((v) => !v)}
              >
                {showAllUpgrades
                  ? t('profile.giveaway.upgrade_less')
                  : t('profile.giveaway.upgrade_more', {
                      n: upgradeable.length - UPGRADE_VISIBLE
                    })}
              </Button>
            )}
          </div>
        ) : hasGiveawayFeedback ? (
          <p className="text-sm text-muted-foreground">
            {t('profile.giveaway.upgrade_none')}
          </p>
        ) : (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              {t('profile.giveaway.upgrade_empty_desc')}
            </p>
            <Button asChild>
              <Link to={getLocalePath('feedback-new', lang)}>
                {t('profile.giveaway.upgrade_empty_cta')}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
