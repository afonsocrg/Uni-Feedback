import { Markdown } from '@uni-feedback/ui'
import { buildMeta } from '~/utils/meta'
import { markdown } from '../../../../legal/guidelines.md'

export function meta() {
  return buildMeta({
    title: 'Feedback Guidelines | Uni Feedback',
    description: 'Official posting guidelines for Uni Feedback.'
  })
}

export default function GuidelinesFull() {
  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <Markdown className="prose-lg">{markdown}</Markdown>
      </div>
    </div>
  )
}
