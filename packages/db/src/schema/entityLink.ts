import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'

export const ENTITY_LINK_KINDS = [
  'linkedin',
  'x',
  'tiktok',
  'instagram',
  'facebook',
  'youtube'
] as const
export type EntityLinkKind = (typeof ENTITY_LINK_KINDS)[number]

// A university's or faculty's official profile (LinkedIn, X, TikTok, Instagram,
// Facebook, YouTube), one row per kind, taken from the school's own site
// (`source_url`). The website stays in universities.url / faculties.url. Only
// reviewed rows are shown (header icons, JSON-LD sameAs). Migration 0060.
export const entityLinks = pgTable(
  'entity_links',
  {
    entity: text('entity').$type<'university' | 'faculty'>().notNull(),
    entityId: integer('entity_id').notNull(),
    kind: text('kind').$type<EntityLinkKind>().notNull(),
    url: text('url').notNull(),
    sourceUrl: text('source_url'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [primaryKey({ columns: [t.entity, t.entityId, t.kind] })]
)

export type EntityLink = typeof entityLinks.$inferSelect
