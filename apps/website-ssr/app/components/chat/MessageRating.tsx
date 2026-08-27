import {
  clearChatMessageRating,
  rateChatMessage
} from '@uni-feedback/api-client'
import { Button, Textarea, cn } from '@uni-feedback/ui'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { analytics } from '~/utils/analytics'

type Rating = 'helpful' | 'not_helpful'

/**
 * Thumbs on one answer.
 *
 * Per message, not per chat: "this chat was bad" is not actionable, while "this
 * answer was bad" points at one message, one set of tool calls and one set of
 * retrieved entities.
 *
 * This is the cheapest detector we have for the failure that matters most, which
 * is a confident, well-formatted, wrong answer. Those are invisible to every
 * other dashboard.
 */
export function MessageRating({ messageId }: { messageId: number }) {
  const { t } = useTranslation('chat')
  const [rating, setRating] = useState<Rating | null>(null)
  const [comment, setComment] = useState('')
  const [commentSent, setCommentSent] = useState(false)

  const rate = async (next: Rating) => {
    // Clicking the same thumb again clears it: a rating is an opinion, and
    // changing your mind should not need a support request.
    const value = rating === next ? null : next
    setRating(value)

    try {
      if (value) {
        analytics.chat.rated({ messageId, rating: value, hasComment: false })
        await rateChatMessage(messageId, value)
      } else {
        // Clearing has to reach the server too, or the student sees an unrated
        // answer while we still hold their old verdict.
        setComment('')
        setCommentSent(false)
        analytics.chat.ratingCleared({ messageId })
        await clearChatMessageRating(messageId)
      }
    } catch {
      // Losing a thumb is not worth interrupting the conversation over.
    }
  }

  const sendComment = async () => {
    if (!rating) return
    setCommentSent(true)
    analytics.chat.rated({ messageId, rating, hasComment: comment.length > 0 })
    try {
      await rateChatMessage(messageId, rating, comment || undefined)
    } catch {
      // Same: best effort.
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-border pt-2">
      <div className="flex items-center gap-1">
        <RatingButton
          label={t('rating_helpful')}
          selected={rating === 'helpful'}
          onClick={() => rate('helpful')}
        >
          <ThumbsUp
            className="size-4"
            fill={rating === 'helpful' ? 'currentColor' : 'none'}
          />
        </RatingButton>
        <RatingButton
          label={t('rating_not_helpful')}
          selected={rating === 'not_helpful'}
          onClick={() => rate('not_helpful')}
        >
          <ThumbsDown
            className="size-4"
            fill={rating === 'not_helpful' ? 'currentColor' : 'none'}
          />
        </RatingButton>
      </div>

      {/* Only after a thumbs down, and always optional. Asking everyone to write
          gets no data; asking the annoyed minority gets the useful data. */}
      {rating === 'not_helpful' && !commentSent && (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted p-3">
          <label
            htmlFor={`rating-comment-${messageId}`}
            className="text-xs font-medium text-foreground"
          >
            {t('rating_comment_label')}
          </label>
          <Textarea
            id={`rating-comment-${messageId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('rating_comment_placeholder')}
            rows={2}
            className="bg-card text-sm"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={sendComment}>
              {t('rating_comment_submit')}
            </Button>
            <span className="ml-auto text-xs text-muted-foreground">
              {t('rating_comment_optional')}
            </span>
          </div>
        </div>
      )}

      {commentSent && (
        <span className="text-xs text-muted-foreground">
          {t('rating_thanks')}
        </span>
      )}
    </div>
  )
}

function RatingButton({
  label,
  selected,
  onClick,
  children
}: {
  label: string
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // aria-pressed rather than a visual-only state, so the selection is
      // announced and not carried by colour alone.
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primaryBlue',
        // Selection is carried by the icon filling in, not by a coloured
        // background. A rating is the student's own mark on the answer, not a
        // verdict the UI should score green or red back at them.
        selected && 'text-foreground'
      )}
    >
      {children}
    </button>
  )
}
