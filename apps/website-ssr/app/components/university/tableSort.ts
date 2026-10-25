import { useState } from 'react'
import type { Lang } from '~/i18n/config'

export type SortDirection = 'asc' | 'desc'
export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

/**
 * Click-to-sort state for the degree tables. A first click on a column sorts
 * text A–Z and numbers biggest first; clicking it again flips the order.
 */
export function useTableSort<K extends string>(
  initial: SortState<K>,
  textKeys: readonly K[],
  onSort: (sort: SortState<K>) => void
) {
  const [sort, setSort] = useState(initial)
  const toggle = (key: K) => {
    const next: SortState<K> =
      sort.key === key
        ? { key, direction: sort.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: textKeys.includes(key) ? 'asc' : 'desc' }
    setSort(next)
    onSort(next)
  }
  return { sort, toggle }
}

/**
 * Rows ordered by `value`, missing values always last whatever the direction.
 * Ties keep their incoming order.
 */
export function sortRows<T>(
  rows: T[],
  value: (row: T) => string | number | null,
  direction: SortDirection,
  lang: Lang
): T[] {
  const sign = direction === 'asc' ? 1 : -1
  return rows
    .map((row, i) => ({ row, i, v: value(row) }))
    .sort((a, b) => {
      if (a.v === null || b.v === null) {
        return a.v === b.v ? a.i - b.i : a.v === null ? 1 : -1
      }
      const diff =
        typeof a.v === 'string' && typeof b.v === 'string'
          ? a.v.localeCompare(b.v, lang, { sensitivity: 'base' })
          : (a.v as number) - (b.v as number)
      return diff * sign || a.i - b.i
    })
    .map(({ row }) => row)
}
