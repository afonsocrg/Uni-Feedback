import { Button } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { analytics } from '~/utils/analytics'

/**
 * Shown once, before the first message.
 *
 * The point is who can read a chat. A student can reasonably guess that nobody
 * else sees it, and cannot guess that we do.
 *
 * Note this deliberately does NOT say "chats are not anonymous, unlike reviews".
 * That framing is wrong: reviews are tied to accounts too. "Anonymous" on Uni
 * Feedback means shown to other students without a name, so the real difference
 * is publication, not linkage.
 */
export function ChatFirstUseNotice({ onAccept }: { onAccept: () => void }) {
  const { t } = useTranslation('chat')

  const points = [
    t('notice_private'),
    t('notice_linked'),
    t('notice_read'),
    t('notice_personal_data')
  ]

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-10">
      <div className="flex max-w-lg flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          {t('notice_title')}
        </h2>
        <ul className="flex flex-col gap-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm">
              <span aria-hidden="true" className="font-bold text-primaryBlue">
                •
              </span>
              <span className="text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
        <Button
          className="self-start"
          onClick={() => {
            analytics.chat.noticeAccepted()
            onAccept()
          }}
        >
          {t('notice_accept')}
        </Button>
      </div>
    </div>
  )
}
