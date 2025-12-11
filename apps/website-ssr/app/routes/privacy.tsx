import { Markdown } from '@uni-feedback/ui'
import { markdown } from '../../../../privacy_policy.md'

export default function Privacy() {
  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <Markdown className="prose-lg">{markdown}</Markdown>
      </div>
    </div>
  )
}
