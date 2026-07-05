import type { Course } from '@uni-feedback/db/schema'
import { addUtmParams } from '~/utils'

export interface OpenWhatsappData {
  text: string
}
export async function openWhatsapp({ text }: OpenWhatsappData) {
  // wa.me is WhatsApp's official universal share link (per WhatsApp's docs:
  // faq.whatsapp.com/5913398998672934): it opens the app on mobile and routes
  // through WhatsApp Web / the app on desktop, with the message pre-filled.
  // https://faq.whatsapp.com/5913398998672934
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    '_blank',
    'noopener,noreferrer'
  )
}

export function getAskForFeedbackMessage(
  course: Course,
  reviewFormUrl: string
) {
  const feedbackUrl = addUtmParams(reviewFormUrl, 'whatsapp')
  const name = course.name
  return `Boas!! Podias dizer-me como foi a tua experiência a fazer ${name}?\n\n${feedbackUrl}\n\nObrigado!!!`
}
