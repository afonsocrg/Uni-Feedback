import { useSearchParams } from 'react-router'
import { ChatPageContent } from '~/components/chat'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/chat'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'chat')
  return buildMeta({
    matches,
    title: t('meta_title'),
    description: t('meta_desc'),
    // Login-gated and per-user. Nothing here should ever be indexed.
    robots: 'noindex, nofollow'
  })
}

export default function ChatPage() {
  const [params] = useSearchParams()

  const number = (key: string) => {
    const raw = params.get(key)
    const parsed = raw ? Number(raw) : Number.NaN
    return Number.isFinite(parsed) ? parsed : undefined
  }

  const courseId = number('courseId')
  const degreeId = number('degreeId')
  const facultyId = number('facultyId')
  const hasScope = Boolean(courseId || degreeId || facultyId)

  const source = params.get('source')
  const knownSources = [
    'navbar',
    'footer',
    'landing',
    'course_page',
    'degree_page',
    'faculty_page'
  ] as const
  type Source = (typeof knownSources)[number] | 'direct'
  const resolvedSource: Source = knownSources.includes(source as never)
    ? (source as Source)
    : 'direct'

  return (
    <ChatPageContent
      chatId={null}
      scope={
        hasScope
          ? {
              courseId,
              degreeId,
              facultyId,
              source: sourceToContext(resolvedSource)
            }
          : null
      }
      source={resolvedSource}
    />
  )
}

/** The API records where a scoped chat came from, so it uses its own vocabulary. */
function sourceToContext(
  source: string
): 'course_page' | 'degree_page' | 'manual' {
  if (source === 'course_page') return 'course_page'
  if (source === 'degree_page') return 'degree_page'
  return 'manual'
}
