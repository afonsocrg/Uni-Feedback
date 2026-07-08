import { Button } from '@uni-feedback/ui'
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Gift,
  Loader2,
  Pencil,
  Sparkles,
  Trophy
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useLang } from '~/hooks'
import { useGiveawayDashboard, useProfileFeedback } from '~/hooks/queries'
import { STORAGE_KEYS } from '~/utils/constants'
import { getLocalePath } from '~/utils/i18n-routes'
import { ReferralShareButtons } from '../referral/ReferralShareButtons'
import { InstagramBonusRow } from './InstagramBonusRow'

/** School year (as stored in the DB) whose feedback counts toward the giveaway. */
const GIVEAWAY_SCHOOL_YEAR = 2025
/** Max points a single feedback can earn (base + all categories + bonus). */
const MAX_FEEDBACK_POINTS = 20
/** Points awarded per confirmed referral (mirrors REFERRAL_POINTS on the API). */
const REFERRAL_POINTS = 15
/** How many upgradeable reviews to show before the "show more" toggle. */
const UPGRADE_VISIBLE = 4

const TILE = 'flex flex-col rounded-xl border bg-card p-5 shadow-sm'
const EYEBROW =
  'mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/80'

/** Small uppercase heading that introduces a section of the dashboard. */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  )
}

export function GiveawayTab({ referralCode }: { referralCode: string | null }) {
  const { t } = useTranslation('feedback')
  const lang = useLang()
  const [showAllUpgrades, setShowAllUpgrades] = useState(false)

  // "How it works" is read-once: default open, but remember a collapse across
  // visits. Read in an effect (not render) to stay hydration-safe.
  const [howtoOpen, setHowtoOpen] = useState(true)
  useEffect(() => {
    if (
      localStorage.getItem(STORAGE_KEYS.GIVEAWAY_HOWTO_COLLAPSED) === 'true'
    ) {
      setHowtoOpen(false)
    }
  }, [])
  const toggleHowto = () =>
    setHowtoOpen((open) => {
      const next = !open
      localStorage.setItem(
        STORAGE_KEYS.GIVEAWAY_HOWTO_COLLAPSED,
        next ? 'false' : 'true'
      )
      return next
    })

  const { data, isLoading, isError } = useGiveawayDashboard()
  const { data: feedbackData } = useProfileFeedback()

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
  const perfectDescText = t('profile.giveaway.perfect_desc_short', {
    threshold: pf.threshold,
    max: MAX_FEEDBACK_POINTS
  })

  // Referral race standing drives three visuals: a celebratory banner when
  // leading, a progress bar when in reach (contender/tied), and a per-friend
  // reward when `far` (too far behind for a bar to motivate).
  const leading = ambassador.state === 'leading'
  const showRaceBar =
    ambassador.state === 'contender' || ambassador.state === 'tied'
  let raceFill = 100
  let raceLabel = t('profile.giveaway.race_tied')
  if (ambassador.state === 'contender') {
    const need = ambassador.referralsToWin ?? 1
    const target = referralCount + need
    raceFill = target > 0 ? Math.round((referralCount / target) * 100) : 0
    raceLabel = t('profile.giveaway.race_to_first', { count: need })
  }
  const leadingSub =
    ambassador.leadOverNext && ambassador.leadOverNext > 0
      ? t('profile.giveaway.race_leading_ahead', {
          count: ambassador.leadOverNext
        })
      : t('profile.giveaway.race_leading_keep')

  // Approved feedback for giveaway-year courses — the pool the boost list works
  // from. `upgradeable` are the ones not yet at full points.
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
    <div className="space-y-8">
      {/* SECTION 1 — How the giveaway works. Explains the prizes and the two
          paths once; collapsible since it's read-once, which gives the standing
          tiles below more emphasis on return visits. */}
      <section className="rounded-xl border bg-card shadow-sm">
        <button
          type="button"
          onClick={toggleHowto}
          aria-expanded={howtoOpen}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gift className="size-4" />
            </div>
            <h3 className="font-semibold">
              {t('profile.giveaway.howto_title')}
            </h3>
          </div>
          <ChevronDown
            className={`size-5 flex-none text-muted-foreground transition-transform ${
              howtoOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {howtoOpen && (
          <div className="px-5 pb-5">
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <CalendarClock className="size-3.5" />
                {t('profile.giveaway.howto_deadline')}
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {t('profile.giveaway.howto_lede')}
            </p>
            <div className="mb-4 space-y-2">
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-[7px] size-2 flex-none rounded-full bg-primaryBlue" />
                <span>{t('profile.giveaway.howto_path_points')}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-[7px] size-2 flex-none rounded-full bg-amber-500" />
                <span>{t('profile.giveaway.howto_path_referrals')}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-3">
              <Link
                to={getLocalePath('giveaway', lang)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('profile.giveaway.links_giveaway')}
              </Link>
              <Link
                to={getLocalePath('points', lang)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('profile.giveaway.links_points')}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2 — Your standing. One compact tile per path, number-first,
          each owning its own next-step CTA so they never compete. */}
      <div>
        <SectionLabel>{t('profile.giveaway.standing_label')}</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Points → raffle entries */}
          <div className={TILE}>
            <p className={EYEBROW}>{t('profile.giveaway.raffle_have')}</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tabular-nums text-primaryBlue">
                  {entries}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t('profile.giveaway.points_word', { count: entries })}
                </span>
              </div>
              {entries > 0 && raffle.topBand && (
                <span className="whitespace-nowrap rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold capitalize text-success">
                  {t(`profile.giveaway.band_label_${raffle.topBand}`)}
                </span>
              )}
            </div>

            <p className="mt-2.5 text-sm text-muted-foreground">
              {entries <= 0
                ? t('profile.giveaway.raffle_zero')
                : raffle.topBand
                  ? t(`profile.giveaway.band_meaning_${raffle.topBand}`)
                  : raffle.nextGoal
                    ? t('profile.giveaway.next_goal', {
                        count: raffle.nextGoal.entriesNeeded,
                        band: t(
                          `profile.giveaway.band_label_${raffle.nextGoal.band}`
                        )
                      })
                    : t('profile.giveaway.raffle_neutral')}
            </p>
            {entries > 0 && raffle.topBand && raffle.nextGoal && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('profile.giveaway.next_goal', {
                  count: raffle.nextGoal.entriesNeeded,
                  band: t(`profile.giveaway.band_label_${raffle.nextGoal.band}`)
                })}
              </p>
            )}

            <div className="mt-auto flex items-center gap-3 pt-4">
              <span className="whitespace-nowrap text-sm font-extrabold text-primaryBlue">
                {t('profile.giveaway.tile_points_reward', {
                  max: MAX_FEEDBACK_POINTS
                })}
              </span>
              <Button asChild className="flex-1">
                <Link to={getLocalePath('feedback-new', lang)}>
                  <Pencil className="size-4" />
                  {t('profile.giveaway.upgrade_empty_cta')}
                </Link>
              </Button>
            </div>
          </div>

          {/* Referrals → most-referrals race */}
          <div className={TILE}>
            <p className={EYEBROW}>{t('profile.giveaway.raffle_have')}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tabular-nums text-amber-500">
                {referralCount}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('profile.giveaway.friends_word', { count: referralCount })}
              </span>
            </div>

            {leading ? (
              <div className="mt-3.5">
                <div className="mb-2.5 flex items-start gap-2">
                  <Trophy className="mt-0.5 size-4 flex-none text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {t('profile.giveaway.race_leading')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leadingSub}
                    </p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            ) : showRaceBar ? (
              <div className="mt-3.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${raceFill}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {raceLabel}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {t('profile.giveaway.race_far')}
              </p>
            )}

            {ambassador.pendingReferrals > 0 && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                {t('profile.giveaway.ambassador_pending', {
                  count: ambassador.pendingReferrals,
                  points: ambassador.potentialPoints
                })}
              </div>
            )}

            {referralCode && (
              <div className="mt-auto pt-4">
                {ambassador.state === 'far' ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                    <span className="text-sm font-extrabold text-amber-500">
                      {t('profile.giveaway.tile_referral_reward', {
                        points: REFERRAL_POINTS
                      })}
                    </span>
                    <div className="min-w-0 sm:flex-1">
                      <ReferralShareButtons
                        referralCode={referralCode}
                        surface="giveaway"
                      />
                    </div>
                  </div>
                ) : (
                  <ReferralShareButtons
                    referralCode={referralCode}
                    surface="giveaway"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3 — Boost your points. The two bonuses share one light panel
          (demoted from full cards), followed by the upgrade-your-feedback list. */}
      <div>
        <SectionLabel>{t('profile.giveaway.boost_title')}</SectionLabel>
        <div className="space-y-5">
          <div className="rounded-xl border bg-card shadow-sm">
            {/* Perfect-feedback bonus. On mobile the reward + progress wrap to
                their own full-width row so the title and description keep the
                full width and stay readable. */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3 p-4">
              <div className="flex size-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {t('profile.giveaway.perfect_title')}
                  {perfectEarned && (
                    <CheckCircle2 className="size-4 flex-none text-success" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {perfectDescText}
                </p>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <span
                  className={`text-lg font-extrabold tabular-nums ${
                    perfectEarned ? 'text-success' : 'text-primaryBlue'
                  }`}
                >
                  +{pf.bonus}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:w-20 sm:flex-none">
                  <span
                    className={`block h-full rounded-full ${
                      perfectEarned ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${perfectPct}%` }}
                  />
                </span>
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                  {pf.current}/{pf.threshold}
                </span>
              </div>
            </div>

            {/* Instagram bonus */}
            <div className="border-t">
              <InstagramBonusRow />
            </div>
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
          ) : null}
        </div>
      </div>
    </div>
  )
}
