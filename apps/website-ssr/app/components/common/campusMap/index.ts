export { CampusMap, type CampusMapItem } from './CampusMap'

/** "Av. Rovisco Pais, 1, 1049-001 Lisboa", or null when we have none of it */
export function campusAddress(campus: {
  address: string | null
  postalCode: string | null
  city: string | null
}): string | null {
  return (
    [campus.address, [campus.postalCode, campus.city].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ') || null
  )
}
