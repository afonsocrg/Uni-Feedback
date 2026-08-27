import { Button, Textarea } from '@uni-feedback/ui'
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
    <div className="flex flex-col gap-2 border-t border-border px-5 py-3">
      <div className="flex items-end gap-2 rounded-lg border border-border bg-card py-2 pl-3 pr-2">
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
          className="max-h-40 min-h-9 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
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
  )
}
