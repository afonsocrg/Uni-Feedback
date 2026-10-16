import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { STORAGE_KEYS } from '~/utils/constants'
import { useJourney } from './queries/useJourney'
import { useAuth } from './useAuth'

type FlagKey = typeof STORAGE_KEYS.JOURNEY_DOT_SEEN

function readIds(key: FlagKey): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * A per-user "done" flag in localStorage, read through React Query.
 *
 * Through the query cache rather than useState so that setting it in one
 * component (opening the profile) clears it everywhere at once (the header
 * dot). `undefined` until read on the client, which callers treat as "done":
 * SSR and the first paint never show a nudge that might then vanish.
 */
function useUserFlag(key: FlagKey) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['local', key, user?.id]

  const { data } = useQuery({
    queryKey,
    queryFn: () => (user ? readIds(key).includes(user.id) : true),
    enabled: !!user,
    staleTime: Infinity
  })

  const set = useCallback(() => {
    if (!user) return
    try {
      const ids = readIds(key)
      if (!ids.includes(user.id)) {
        localStorage.setItem(key, JSON.stringify([...ids, user.id]))
      }
    } catch {
      // Storage blocked: the nudge just shows again next time.
    }
    queryClient.setQueryData(['local', key, user.id], true)
  }, [key, user, queryClient])

  return { isSet: data, set }
}

/**
 * The red dot on the account menu: shown while the student has no saved degree
 * and has not opened the profile since. It means "something new for you", so
 * one visit clears it, with or without saving anything. A dot that only goes
 * away by handing over data reads as nagging.
 */
export function useJourneyDot() {
  const { isAuthenticated } = useAuth()
  const { isSet: seen, set: markSeen } = useUserFlag(
    STORAGE_KEYS.JOURNEY_DOT_SEEN
  )
  // Only fetched for students who have not seen it yet, so everyone else pays
  // no extra request on every page.
  const { data } = useJourney({ enabled: isAuthenticated && seen === false })
  const showDot =
    isAuthenticated && seen === false && data?.degrees.length === 0
  // `isReady` once we know whether it was seen, so a caller recording "came
  // from the dot" does not read the not-yet-loaded flag as "no dot".
  return { showDot, isReady: seen !== undefined, markSeen }
}
