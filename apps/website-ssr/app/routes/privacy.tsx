import { Markdown } from '@uni-feedback/ui'
import { buildMeta, metaT } from '~/utils/meta'
import { markdown } from '../../../../legal/privacy_policy.md'
import type { Route } from './+types/privacy'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('privacy.meta_title'),
    description: t('privacy.meta_desc')
  })
}

export default function Privacy() {
  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <Markdown className="prose-lg">{markdown}</Markdown>
      </div>
    </div>
  )
}
