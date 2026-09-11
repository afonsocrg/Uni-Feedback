import type { ChatGap } from '@uni-feedback/api-client'
import { Button } from '@uni-feedback/ui'
import { Check, Link2, PenLine, Plus, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLang, useShare } from '~/hooks'
import { analytics } from '~/utils/analytics'
import { ADD_COURSE_FORM_URL } from '~/utils/constants'
import { getCourseFeedbackPath } from '~/utils/i18n-routes'

interface ChatGapAskProps {
  chatId: string
  gap: ChatGap
}

/**
 * The ask under an answer that came up short.
 *
 * The chat is open to everyone, so this is where a thin answer is handled: not
 * by refusing at the door, but by saying what is missing and offering the one
 * next step that fits.
 *
 * **The ask has to match what the student demonstrated.** Someone asking what
 * people say about a course almost certainly has not taken it: they showed
 * demand, not supply. Asking them to review it is asking the wrong person at the
 * moment they are already disappointed, so the primary action is to recruit
 * someone who did take it. "Eu fiz esta cadeira" stays as a quiet secondary,
 * because sometimes they did.
 *
 * That reasoning stops at structural data. A course description is public on the
 * university's own site, so anyone can paste it in, and that ask goes straight
 * to the existing correction dialog.
 */
export function ChatGapAsk({ chatId, gap }: ChatGapAskProps) {
  const { t } = useTranslation('chat')
  const lang = useLang()
  const { copied, copyLink } = useShare({
    copied: t('gap.share_copied'),
    failed: t('gap.share_failed')
  })

  const track = (action: 'share' | 'review' | 'correct' | 'add_course') =>
    analytics.chat.gapActionClicked({ chatId, kind: gap.kind, action })

  if (gap.kind === 'no_reviews' && gap.courseUrl) {
    return (
      <GapCard body={t('gap.no_reviews', { name: gap.courseName ?? '' })}>
        <Button
          size="sm"
          onClick={() => {
            track('share')
            void copyLink(gap.courseUrl ?? null)
          }}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Share2 className="size-3.5" />
          )}
          {t('gap.share_course')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          asChild
          onClick={() => track('review')}
        >
          <a
            href={`${getCourseFeedbackPath(lang, gap.courseId ?? 0)}?from=chat_gap`}
          >
            {t('gap.i_took_it')}
          </a>
        </Button>
      </GapCard>
    )
  }

  if (gap.kind === 'missing_field' && gap.courseUrl) {
    return (
      <GapCard body={t('gap.missing_field', { name: gap.courseName ?? '' })}>
        <Button
          size="sm"
          variant="outline"
          asChild
          onClick={() => track('correct')}
        >
          {/* Opens the correction dialog already targeted at the missing field.
              The chat owns no contribution UI of its own: the course page
              already has the editor, the auth gate and the funnel. */}
          <a href={`${gap.courseUrl}?correct=${gap.field ?? 'description'}`}>
            <PenLine className="size-3.5" />
            {t('gap.add_description')}
          </a>
        </Button>
      </GapCard>
    )
  }

  if (gap.kind === 'no_courses') {
    return (
      <GapCard body={t('gap.no_courses')}>
        <Button
          size="sm"
          variant="outline"
          asChild
          onClick={() => track('add_course')}
        >
          <a href={ADD_COURSE_FORM_URL} target="_blank" rel="noreferrer">
            <Plus className="size-3.5" />
            {t('gap.add_course')}
          </a>
        </Button>
      </GapCard>
    )
  }

  return null
}

function GapCard({
  body,
  children
}: {
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-1 flex flex-col gap-2.5 rounded-lg border border-border bg-muted px-3.5 py-3">
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Link2 className="mt-0.5 size-3.5 shrink-0" />
        {body}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  )
}
