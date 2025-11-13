import { HOUR, MINUTE } from '~/utils/time_ms'

export const infrequentDataConfig = {
  staleTime: 1 * HOUR
}

export const frequentDataConfig = {
  staleTime: 1 * MINUTE,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
}
