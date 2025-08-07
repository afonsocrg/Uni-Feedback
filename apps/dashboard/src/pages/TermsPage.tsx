import { Markdown } from '@uni-feedback/ui'
import termsContent from '../../../../terms_of_service.md'

export function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <Markdown className="prose-lg">{termsContent}</Markdown>
        </div>
      </div>
    </div>
  )
}
