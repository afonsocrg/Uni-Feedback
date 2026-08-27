import { useParams } from 'react-router'
import { ChatPageContent } from '~/components/chat'
import { buildMeta, metaT } from '~/utils/meta'
import type { Route } from './+types/chat.$chatId'

export function meta({ location, matches }: Route.MetaArgs) {
  const t = metaT(location, 'chat')
  return buildMeta({
    matches,
    title: t('meta_title'),
    description: t('meta_desc'),
    robots: 'noindex, nofollow'
  })
}

export default function ChatDetailPage() {
  const { chatId } = useParams()
  const parsed = Number(chatId)

  return (
    <ChatPageContent
      chatId={Number.isFinite(parsed) ? parsed : null}
      scope={null}
      source="direct"
    />
  )
}
