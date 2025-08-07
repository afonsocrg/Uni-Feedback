import { Markdown } from '@uni-feedback/ui'
import privacyContent from '../../../../privacy_policy.md'

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <Markdown className="prose-lg">{privacyContent}</Markdown>
        </div>
      </div>
    </div>
  )
}