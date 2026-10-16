import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@uni-feedback/ui'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '~/hooks'
import { useJourney } from '~/hooks/queries'
import { analytics, type JourneyChatPromptState } from '~/utils/analytics'
import { DegreeForm } from './DegreeForm'
import { useDegreeEditor } from './useDegreeEditor'

/**
 * "De que curso és?" above the chat's suggestions.
 *
 * This is where chat users get reached: most of them have no reviews, so
 * there is nothing to infer and the profile is a page they may never open.
 * Once a degree is saved it disappears; the profile is where it gets changed.
 */
export function JourneyChatPrompt() {
  const { t } = useTranslation('chat')
  const { t: tf } = useTranslation('feedback')
  const { isAuthenticated } = useAuth()
  const { data } = useJourney({ enabled: isAuthenticated })
  // "Agora não" hides it for this chat only. It comes back on the next empty
  // chat until they pick a degree: one small line, never blocking.
  const [dismissed, setDismissed] = useState(false)
  const editor = useDegreeEditor('chat')
  const tracked = useRef(false)

  const current = data?.degrees[0] ?? null
  const inferred = data && !current ? data.inferred : null
  const state: JourneyChatPromptState | null =
    !data || current || dismissed ? null : inferred ? 'inferred' : 'empty'

  useEffect(() => {
    if (!state || tracked.current) return
    tracked.current = true
    analytics.journey.chatPromptShown({ state })
  }, [state])

  if (!isAuthenticated || !data) return null

  // Nothing once a degree is saved: a chat opened from another degree's page
  // is scoped to that degree, so naming the saved one here would mislead.
  if (!state) return null

  const notNow = () => {
    analytics.journey.chatPromptDismissed({ state })
    setDismissed(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-md border border-dashed border-tint-blue-border bg-tint-blue/50 px-3 py-2.5 text-sm">
        <div className="min-w-0">
          <p className="text-foreground">
            {inferred
              ? t('journey_prompt.inferred_question', {
                  degree: inferred.degreeAcronym,
                  faculty: inferred.facultyShortName
                })
              : t('journey_prompt.empty_question')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('journey_prompt.why')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {inferred ? (
            <>
              <Button
                size="sm"
                disabled={editor.isBusy}
                onClick={() => editor.confirmInferred(inferred)}
              >
                {t('journey_prompt.yes')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  editor.openForm({ mode: 'inferred', degree: inferred })
                }
              >
                {t('journey_prompt.change')}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => editor.openForm({ mode: 'add' })}>
              {t('journey_prompt.pick')}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={notNow}>
            {t('journey_prompt.not_now')}
          </Button>
        </div>
        {editor.error && !editor.form && (
          <p role="alert" className="w-full text-xs text-destructive">
            {editor.error}
          </p>
        )}
      </div>

      <Dialog
        open={editor.form !== null}
        onOpenChange={(open) => {
          // Closed from outside the form (X, Esc, backdrop). The form's own
          // Cancel reports the real step; this path cannot see it.
          if (!open && editor.form) editor.cancelForm('faculty')
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('journey_prompt.dialog_title')}</DialogTitle>
          </DialogHeader>
          {editor.form && (
            <DegreeForm
              initial={editor.initialValues(editor.form)}
              submitLabel={tf('profile.journey.save_edit')}
              isSubmitting={editor.isBusy}
              error={editor.error}
              onSubmit={editor.submitForm}
              onCancel={editor.cancelForm}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
