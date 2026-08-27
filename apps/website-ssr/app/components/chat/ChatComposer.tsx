import { Button, Textarea, cn } from '@uni-feedback/ui'
import { ArrowUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ChatComposerProps {
  onSend: (content: string) => void
  disabled: boolean
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const { t } = useTranslation('chat')
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    setValue('')
    onSend(trimmed)
    ref.current?.focus()
  }

  return (
    // The border spans the window, the input does not: a composer stretched
    // across a wide screen puts the send button an inch from the frame and
    // makes typed text scan badly. Same max-width as the messages, so the
    // column reads as one thing.
    <div className="border-t border-border px-5 py-3">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {/* The row is the input: it carries the border, the surface and the focus
          ring, because the textarea inside it is stripped bare. Without
          focus-within there would be no visible keyboard focus at all. */}
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card py-2 pl-3 pr-2 focus-within:border-primaryBlue focus-within:ring-2 focus-within:ring-primaryBlue/30">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line: the convention every
              // chat has trained students to expect.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={t('placeholder')}
            rows={1}
            maxLength={2000}
            className={cn(
              'max-h-40 min-h-9 resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0',
              // The row is the input surface, so the textarea itself must be
              // invisible. `dark:bg-transparent` is required: the base component
              // sets `dark:bg-input/30`, and a plain `bg-transparent` loses to it
              // because the dark variant wins the cascade. Without this the
              // textarea paints a lighter block inside the border.
              'bg-transparent dark:bg-transparent',
              // The component ships `w-full`, which in a flex row claims the whole
              // line and pushes the send button off the end. flex-1 + min-w-0 lets
              // it take the space that is left and shrink when the text wraps.
              'w-auto min-w-0 flex-1'
            )}
          />
          <Button
            size="icon"
            onClick={submit}
            disabled={disabled || value.trim().length === 0}
            aria-label={t('send')}
            className="size-8 shrink-0"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('composer_hint')}
        </span>
      </div>
    </div>
  )
}
