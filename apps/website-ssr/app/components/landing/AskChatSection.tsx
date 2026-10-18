import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AskChatInput } from '~/components/chat/AskChatInput'
import { useShowChatEntryPoints } from '~/hooks'

/**
 * The chat's entry point on the landing page.
 *
 * Added for mobile. On desktop the chat has a chip in the navbar; on a phone it
 * hides in the drawer, and phones opened it at a sixth of the desktop rate
 * (0.5% vs 2.9% of visitors, week 1). It sits just under the hero and its
 * supporters strip, about as far as the median landing visit scrolls
 * (2026-10-18), but deliberately off the first screen: two input boxes there
 * compete with the search. Its reach is `landing_section_viewed{section:
 * 'ask_chat'}`.
 *
 * The copy says what the chat can actually do (rankings, assessment, choosing
 * between courses) rather than only "what students said", since it also
 * answers from each course's own data. It speaks as us ("Pergunta-nos",
 * "Respondemos"), not about "o Chat IA": the chat is Uni Feedback answering. No clickable example questions on
 * purpose: we would stop learning what students want to ask (decided
 * 2026-09-25 for the browse pages).
 */
export function AskChatSection() {
  const { t } = useTranslation('landing')
  const showChatEntryPoints = useShowChatEntryPoints()

  if (!showChatEntryPoints) return null

  return (
    <section className="pb-12 pt-2 md:pb-20 md:pt-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-blue px-3 py-1 text-sm font-medium text-tint-blue-fg">
            <MessageCircle aria-hidden="true" className="size-4" />
            {t('ask_chat.eyebrow')}
          </span>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            {t('ask_chat.title')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('ask_chat.subtitle')}
          </p>
          <AskChatInput
            source="landing"
            size="lg"
            placeholder={t('ask_chat.placeholder')}
            className="mx-auto w-full max-w-xl text-left"
          />
        </div>
      </div>
    </section>
  )
}
