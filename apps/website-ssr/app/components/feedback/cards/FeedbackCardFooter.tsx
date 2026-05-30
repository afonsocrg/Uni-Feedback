import { getRelativeTime } from '@uni-feedback/utils'
import { useLang } from '~/hooks'

interface FeedbackCardFooterProps {
  courseName: string
  facultyShortName?: string | null
  createdAt: Date | number | null
}

export function FeedbackCardFooter({
  courseName,
  facultyShortName,
  createdAt
}: FeedbackCardFooterProps) {
  const lang = useLang()
  return (
    <div className="pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-600 truncate mb-0.5">{courseName}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {facultyShortName ?? 'University'}
        </p>
        <p className="text-xs text-gray-400 shrink-0">
          {getRelativeTime(createdAt, lang)}
        </p>
      </div>
    </div>
  )
}
