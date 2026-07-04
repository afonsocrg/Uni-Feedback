/**
 * Group an array into a `Map` of arrays, keyed by the value `keyFn` returns.
 *
 * A `Map` (rather than a plain object) is used so keys keep their real type:
 * numbers stay numbers, and `null`/`undefined` are valid keys. Insertion order
 * is preserved; sorting is intentionally left to the caller (a separate concern).
 */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }
  return groups
}
