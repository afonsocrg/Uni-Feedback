import { Markdown } from '@uni-feedback/ui'
import { buildMeta, metaT } from '~/utils/meta'
import { markdown } from '../../../../legal/terms_of_service.md'
import type { Route } from './+types/terms'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('terms.meta_title'),
    description: t('terms.meta_desc')
  })
}

export default function Terms() {
  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <Markdown className="prose-lg">{markdown}</Markdown>
      </div>
    </div>
  )
}
