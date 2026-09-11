import { useRouteLoaderData } from 'react-router'

/**
 * Should this page advertise the chat?
 *
 * Gates every entry point: the navbar chip, the footer link, the mobile drawer,
 * and the "ask about this" buttons on course, degree, faculty and browse pages.
 * Comes from `SHOW_CHAT_ENTRY_POINTS` in this server's environment, read by the
 * root loader (see the `env-vars-in-website-ssr` skill for why there and not
 * `import.meta.env`): changing it is a restart, not a rebuild.
 *
 * **This is not the kill switch, and the name says so.** `CHAT_ENABLED` on the
 * API is: it decides whether answers are generated and money is spent. This one
 * only decides whether we point at the feature, which is why the two are named
 * differently and why they are allowed to disagree:
 *
 *   API off, entry points on   an incident. You bounce the API and leave the
 *                              site alone; students who follow a link get the
 *                              honest resting screen. The common case.
 *   API on, entry points off   a soft launch. The chat really works at /chat so
 *                              it can be used for real, without being
 *                              advertised anywhere yet.
 *
 * `/chat` itself is never gated here. Someone with a bookmark should get the
 * resting screen, not a 404 claiming the thing never existed.
 *
 * Read by route id rather than with a bare `useLoaderData`, because the root
 * layout also wraps the error path, where an unqualified call resolves to the
 * errored leaf route instead. Defaults to false, which is what an error page
 * gets: better to hide a working chat than to advertise a missing one.
 */
export function useShowChatEntryPoints(): boolean {
  const rootData = useRouteLoaderData('root') as
    | { showChatEntryPoints?: boolean }
    | undefined
  return rootData?.showChatEntryPoints ?? false
}
