import { Markdown } from '@uni-feedback/ui'
import { markdown } from '../../../../privacy_policy.md'

export default function Privacy() {
  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <Markdown className="prose-lg">{markdown}</Markdown>
        </div>
      </div>
    </div>
  )
}
