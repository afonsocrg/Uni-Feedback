import { database, schema } from '@uni-feedback/db'
import { ENTITY_LINK_KINDS, type EntityLinkKind } from '@uni-feedback/db/schema'
import { and, eq, isNotNull } from 'drizzle-orm'

export interface OfficialLink {
  kind: EntityLinkKind
  url: string
}

/**
 * A university's or faculty's reviewed official profiles (entity_links, 0060),
 * in a fixed order: LinkedIn, Instagram, TikTok, X, Facebook, YouTube. The
 * website is `url` on the entity itself, not one of these.
 */
export async function loadOfficialLinks(
  entity: 'university' | 'faculty',
  entityId: number
): Promise<OfficialLink[]> {
  const rows = await database()
    .select({ kind: schema.entityLinks.kind, url: schema.entityLinks.url })
    .from(schema.entityLinks)
    .where(
      and(
        eq(schema.entityLinks.entity, entity),
        eq(schema.entityLinks.entityId, entityId),
        isNotNull(schema.entityLinks.reviewedAt)
      )
    )
  const order: EntityLinkKind[] = [
    'linkedin',
    'instagram',
    'tiktok',
    'x',
    'facebook',
    'youtube'
  ]
  return rows
    .filter((r) => ENTITY_LINK_KINDS.includes(r.kind))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
}
