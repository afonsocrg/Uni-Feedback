import { redirect } from 'react-router'
import { detectLang, getLocalePath } from '~/utils/i18n-routes'

import type { Route } from './+types/giveaway.results'

/**
 * Gone, permanently redirected to the campaign page.
 *
 * The results used to live here while /giveaway was still selling entries. Once
 * the winners were drawn the campaign page became the wrap-up and absorbed all
 * of it: the winners, the totals and the degree leaderboard. Two pages saying
 * the same thing meant two places to keep correct, and the one people actually
 * land on is /giveaway.
 *
 * NOT deleted, because this URL is in the wild. It was linked from the campaign
 * hero and the landing band for the whole of July, it carries its own OG image
 * precisely so it could be pasted into WhatsApp groups, and the wrap-up email to
 * students who never entered points straight at it. A 404 for any of those is a
 * student concluding the results were taken down.
 *
 * 301 rather than 302: the move is permanent, so search engines transfer to
 * /giveaway instead of indexing both.
 */
export function loader({ request }: Route.LoaderArgs) {
  const lang = detectLang(new URL(request.url).pathname)
  return redirect(getLocalePath('giveaway', lang), 301)
}
