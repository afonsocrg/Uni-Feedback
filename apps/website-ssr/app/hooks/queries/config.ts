import { HOUR, MINUTE } from '~/utils/time_ms'

export const infrequentDataConfig = {
  staleTime: 24 * HOUR,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false
}

export const frequentDataConfig = {
  staleTime: 1 * MINUTE,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true
}