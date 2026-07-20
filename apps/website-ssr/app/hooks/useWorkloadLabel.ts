import { useTranslation } from 'react-i18next'

/**
 * Returns a mapper from a workload rating (1-5) to its localized label, sourced
 * from the `workload_ratings` array in the `common` namespace. Use this to feed
 * the `label` prop of `<WorkloadRatingDisplay>`; without it the component falls
 * back to hardcoded English strings.
 */
export function useWorkloadLabel(): (rating: number) => string {
  const { t } = useTranslation('common')
  const labels = t('workload_ratings', { returnObjects: true }) as string[]
  return (rating: number) => labels[Math.round(rating) - 1]
}
