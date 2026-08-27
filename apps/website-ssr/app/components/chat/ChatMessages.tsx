import { Markdown } from '@uni-feedback/ui'
import { useTranslation } from 'react-i18next'
import { analytics } from '~/utils/analytics'
import { MessageRating } from './MessageRating'

export interface DisplayMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessagesProps {
  chatId: number
  messages: DisplayMessage[]
  /** Name of the tool currently running, or null when nothing is in flight. */
  workingTool: string | null
}

export function ChatMessages({
  chatId,
  messages,
  workingTool
}: ChatMessagesProps) {
  const { t } = useTranslation('chat')

  return (
    // min-h-0 is what makes flex-1 actually scroll instead of growing the
    // shell past the viewport.
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primaryBlue px-3.5 py-2 text-sm text-white">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex max-w-[68ch] flex-col gap-1">
              <Markdown
                className="text-sm text-foreground [&_blockquote]:my-2 [&_blockquote]:rounded-r-md [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:bg-muted [&_blockquote]:px-3 [&_blockquote]:py-2"
                components={{
                  // Every link in an answer points into the site, which is the
                  // whole point of grounding. Tracking the click is how we find
                  // out whether the chat feeds the site or eats it.
                  a: ({ href, ...props }) => (
                    <a
                      {...props}
                      href={href}
                      className="text-primaryBlue underline underline-offset-2 hover:text-primaryBlue/80"
                      onClick={() =>
                        analytics.chat.citationClicked({
                          chatId,
                          entityType: entityTypeFromHref(href),
                          href: href ?? ''
                        })
                      }
                    />
                  )
                }}
              >
                {message.content}
              </Markdown>
              {/* Optimistic messages have no server id yet, so nothing to rate. */}
              {message.id > 0 && <MessageRating messageId={message.id} />}
            </div>
          )
        )}

        {workingTool !== null && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-live="polite"
          >
            <span className="size-1.5 animate-pulse rounded-full bg-primaryBlue motion-reduce:animate-none" />
            {/* Named after the tool actually running. A turn takes 3 to 14
              seconds, and a spinner that says nothing reads as broken. */}
            {t(`working_tool.${workingTool}`, { defaultValue: t('working') })}
          </div>
        )}
      </div>
    </div>
  )
}

function entityTypeFromHref(href?: string): 'course' | 'degree' | 'faculty' {
  if (!href) return 'course'
  if (href.includes('/cadeiras/') || href.includes('/courses/')) return 'course'
  // Degree pages are /:facultySlug/:degreeSlug, faculty pages are /:facultySlug.
  const path = href.replace(/^https?:\/\/[^/]+/, '').replace(/^\/|\/$/g, '')
  return path.split('/').length >= 2 ? 'degree' : 'faculty'
}
