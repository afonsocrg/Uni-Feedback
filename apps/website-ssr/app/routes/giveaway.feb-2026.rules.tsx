import { Markdown } from '@uni-feedback/ui'
import { buildMeta, metaT } from '~/utils/meta'
import { markdown } from '../../../../legal/giveaway_rules_feb_2026.md'
import type { Route } from './+types/giveaway.feb-2026.rules'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'legal')
  return buildMeta({
    matches,
    title: t('giveaway_recap.rules_meta_title'),
    description: t('giveaway_recap.rules_meta_desc')
  })
}

export default function GiveawayFeb2026RulesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-18">
      <div className="mx-auto max-w-2xl">
        <Markdown
          className="prose-lg text-muted-foreground"
          components={{
            h1: ({ node: _node, ref: _ref, ...props }) => (
              <h1
                {...props}
                className="text-3xl font-semibold text-foreground mb-4"
              />
            ),
            h2: ({ node: _node, ref: _ref, ...props }) => (
              <h2
                {...props}
                className="text-2xl font-semibold text-foreground mt-10 mb-4"
              />
            ),
            h3: ({ node: _node, ref: _ref, ...props }) => (
              <h3
                {...props}
                className="text-lg font-semibold text-foreground mt-5 mb-1"
              />
            ),
            ul: ({ node: _node, ref: _ref, ...props }) => (
              <ul
                {...props}
                className="ml-6 list-disc space-y-1 text-muted-foreground"
              />
            ),
            p: ({ node: _node, ref: _ref, ...props }) => (
              <p {...props} className="mt-2" />
            ),
            hr: () => <hr className="my-8 border-t border-border" />,
            strong: ({ node: _node, ref: _ref, ...props }) => (
              <strong {...props} className="text-foreground font-semibold" />
            )
          }}
        >
          {markdown}
        </Markdown>
      </div>
    </div>
  )
}
