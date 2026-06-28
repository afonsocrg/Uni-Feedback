import { Markdown } from '@uni-feedback/ui'
import { markdown } from '../../../../legal/giveaway_rules_feb_2026.md'

export function meta() {
  return [
    { title: 'Giveaway Rules (Feb 2026) | Uni Feedback' },
    {
      name: 'description',
      content:
        'Official rules for the February 2026 Uni Feedback giveaway (NOS Alive 2026). Archived for reference.'
    }
  ]
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
                className="text-3xl font-semibold text-gray-900 mb-4"
              />
            ),
            h2: ({ node: _node, ref: _ref, ...props }) => (
              <h2
                {...props}
                className="text-2xl font-semibold text-gray-900 mt-10 mb-4"
              />
            ),
            h3: ({ node: _node, ref: _ref, ...props }) => (
              <h3
                {...props}
                className="text-lg font-semibold text-gray-900 mt-5 mb-1"
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
            hr: () => <hr className="my-8 border-t border-gray-200" />,
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
