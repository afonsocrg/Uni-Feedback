import { Markdown } from '@uni-feedback/ui'
import { markdown } from '../../../../legal/guidelines.md'

export function meta() {
  return [
    { title: 'Feedback Guidelines | Uni Feedback' },
    {
      name: 'description',
      content: 'Official posting guidelines for Uni Feedback.'
    }
  ]
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
