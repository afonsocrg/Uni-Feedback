import { getFaculties } from '@uni-feedback/api-client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthDialog } from '~/components/AuthDialog'
import type { AuthUser } from '~/context/AuthContext'
import { analytics } from '~/utils/analytics'
import { ChatAccessRequestDialog } from './ChatAccessRequestDialog'

interface ChatLoginWallProps {
  open: boolean
  /** The entry point, carried on every funnel event. */
  source: string
  /** The question waiting on the login, handed to the access form if they
   *  cannot sign up at all. */
  question: string | null
  /** Signed in. The wall has already closed and counted the completion. */
  onSuccess: (user: AuthUser) => void
  /** The wall closed without a login, by dismissal or by swapping to the
   *  access form. */
  onClose: () => void
}

/**
 * The chat's login wall, wherever a question is asked.
 *
 * One component for the chat page and the course page's own box, so both walls
 * check the same email domains, offer the same way out to the access form, and
 * feed the same funnel events. Two copies would drift, and a funnel whose steps
 * mean different things per entry point cannot be compared across them.
 *
 * The caller fires `chat_login_wall_shown`, because only the caller knows why it
 * opened (a send, or a session that expired mid-chat).
 */
export function ChatLoginWall({
  open,
  source,
  question,
  onSuccess,
  onClose
}: ChatLoginWallProps) {
  const { t } = useTranslation('chat')
  const [accessOpen, setAccessOpen] = useState(false)

  /**
   * Every domain we can verify, so the dialog can say "not one of ours" before
   * sending a code that was never going to arrive.
   *
   * Fetched only once the wall is actually needed. An empty list simply means no
   * client-side check and the API refuses as it always did.
   */
  const [emailSuffixes, setEmailSuffixes] = useState<string[]>([])
  useEffect(() => {
    if (!open || emailSuffixes.length > 0) return
    getFaculties()
      .then((faculties) =>
        setEmailSuffixes(faculties.flatMap((f) => f.emailSuffixes ?? []))
      )
      .catch(() => undefined)
  }, [open, emailSuffixes.length])

  return (
    <>
      <AuthDialog
        open={open}
        onSuccess={(user) => {
          analytics.chat.loginWallCompleted({ source })
          onSuccess(user)
        }}
        onClose={() => {
          analytics.chat.loginWallAbandoned({ source })
          onClose()
        }}
        title={t('login_dialog_title')}
        description={t('login_dialog_description')}
        trigger="chat"
        allowedEmailSuffixes={
          emailSuffixes.length > 0 ? emailSuffixes : undefined
        }
        noUniversityEmail={{
          label: t('access.no_university_email'),
          explanation: t('access.wrong_domain'),
          // Swaps one dialog for the other. Keeping them separate components
          // means AuthDialog stays generic: it offers a door, it does not know
          // what is behind it.
          onClick: () => {
            onClose()
            setAccessOpen(true)
          }
        }}
      />

      <ChatAccessRequestDialog
        open={accessOpen}
        onOpenChange={setAccessOpen}
        source="login_wall"
        question={question}
      />
    </>
  )
}
