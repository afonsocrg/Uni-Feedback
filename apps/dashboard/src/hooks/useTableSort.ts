import { useCallback, useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

/** The active sort, or null when the table is in its natural order. */
export type SortState<K extends string = string> = {
  key: K
  direction: SortDirection
} | null

export interface UseTableSortOptions<K extends string> {
  /** Sort to start with. Defaults to none. */
  initial?: SortState<K>
  /**
   * Direction the first click on a column selects. Counts and dates want
   * `desc` (biggest or newest first), names want `asc`. Defaults to `desc`;
   * override per column with the second argument of `toggle`.
   */
  firstDirection?: SortDirection
}

export interface UseTableSortReturn<K extends string> {
  sort: SortState<K>
  /** Is this column the active one, and which way. Convenient for headers. */
  directionOf: (key: K) => SortDirection | null
  /**
   * Cycle a column: off → first direction → the other direction → off.
   * Clicking a different column starts that column's cycle from the top.
   */
  toggle: (key: K, firstDirection?: SortDirection) => void
  clear: () => void
  /**
   * Sort rows on the client. `value` maps a row to the comparable value for
   * the active key; strings compare case-insensitively, null and undefined
   * sink to the bottom whichever way the sort goes. Returns the input array
   * untouched when no sort is active, so natural order survives.
   */
  sortRows: <Row>(
    rows: Row[],
    value: (row: Row, key: K) => string | number | Date | null | undefined
  ) => Row[]
}

/**
 * Tri-state column sorting for a table: one click sorts, the next flips it,
 * the third turns it off. The hook only owns the state. For a client-side
 * table pair it with `sortRows`; for a paginated, server-sorted list feed
 * `sort.key` and `sort.direction` into the query instead. Headers render the
 * state with `SortableTableHead`. See the dashboard-table-sorting skill.
 */
export function useTableSort<K extends string>(
  options: UseTableSortOptions<K> = {}
): UseTableSortReturn<K> {
  const { initial = null, firstDirection = 'desc' } = options
  const [sort, setSort] = useState<SortState<K>>(initial)

  const toggle = useCallback(
    (key: K, first: SortDirection = firstDirection) => {
      setSort((current) => {
        if (current?.key !== key) return { key, direction: first }
        if (current.direction === first) {
          return { key, direction: first === 'desc' ? 'asc' : 'desc' }
        }
        return null
      })
    },
    [firstDirection]
  )

  const clear = useCallback(() => setSort(null), [])

  const directionOf = useCallback(
    (key: K) => (sort?.key === key ? sort.direction : null),
    [sort]
  )

  const sortRows = useCallback(
    <Row>(
      rows: Row[],
      value: (row: Row, key: K) => string | number | Date | null | undefined
    ) => {
      if (!sort) return rows
      const { key, direction } = sort
      const sign = direction === 'asc' ? 1 : -1
      return [...rows].sort((a, b) => {
        const va = value(a, key)
        const vb = value(b, key)
        const aEmpty = va === null || va === undefined
        const bEmpty = vb === null || vb === undefined
        if (aEmpty && bEmpty) return 0
        if (aEmpty) return 1
        if (bEmpty) return -1
        if (typeof va === 'string' && typeof vb === 'string') {
          return (
            sign *
            va.localeCompare(vb, undefined, {
              sensitivity: 'base',
              numeric: true
            })
          )
        }
        const na = va instanceof Date ? va.getTime() : (va as number)
        const nb = vb instanceof Date ? vb.getTime() : (vb as number)
        return sign * (na < nb ? -1 : na > nb ? 1 : 0)
      })
    },
    [sort]
  )

  return useMemo(
    () => ({ sort, directionOf, toggle, clear, sortRows }),
    [sort, directionOf, toggle, clear, sortRows]
  )
}
