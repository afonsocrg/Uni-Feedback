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

  const title = t('giveaway.meta_title')
  const description = t('giveaway.meta_desc')
  const imageUrl = `${origin}/giveaway/og-${lang}.png`

  return [
    { title },
    { name: 'description', content: description },

    // Open Graph tags
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${origin}/giveaway` },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },

    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl }
  ]
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
