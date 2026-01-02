import { Markdown } from '@uni-feedback/ui'
import { markdown } from '../../../../legal/terms_of_service.md'

export default function Terms() {
  return (
    <div className="min-h-full">
      <div className="mx-auto px-4 py-8 max-w-2xl">
        <Markdown className="prose-lg">{markdown}</Markdown>
      </div>
    </div>
  )
}
