import {
  GiveawayCTASection,
  GiveawayFAQSection,
  GiveawayHeroSection,
  GiveawayPointsSection,
  GiveawayPrizesSection,
  HowToWinSection
} from '~/components/giveaway'
import { i18n } from '~/i18n/config'
import { detectLang } from '~/utils/i18n-routes'
import { buildMeta } from '~/utils/meta'
import { getRequestOrigin } from '~/utils/request'

import type { Route } from './+types/giveaway'

export function loader({ request }: Route.LoaderArgs) {
  const origin = getRequestOrigin(request)
  const lang = detectLang(new URL(request.url).pathname)
  return { origin, lang }
}

export function meta({ loaderData }: Route.MetaArgs) {
  const { origin, lang } = loaderData
  const t = i18n.getFixedT(lang, 'legal')

  return buildMeta({
    title: t('giveaway.meta_title'),
    description: t('giveaway.meta_desc'),
    url: `${origin}/giveaway`,
    image: {
      url: `${origin}/giveaway/og-${lang}.png`,
      width: 1200,
      height: 630
    }
  })
}

export default function GiveawayPage() {
  return (
    <>
      <GiveawayHeroSection />
      <HowToWinSection />
      <GiveawayPrizesSection />
      <GiveawayPointsSection />
      <GiveawayFAQSection />
      <GiveawayCTASection />
    </>
  )
}
