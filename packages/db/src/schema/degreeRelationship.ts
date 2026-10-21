import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { degrees } from './degree'

// Typed links between degrees (migration 0055), like courseRelationships.
// 'equivalent' | 'similar' | 'campus_sibling' are stored in both directions;
// 'continues_to' is directed (licenciatura -> mestrado). `source` records how the
// link was found ('dges_codc', 'cnaef', 'catalogue', 'manual', ...).
export const degreeRelationships = pgTable(
  'degree_relationships',
  {
    sourceDegreeId: integer('source_degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    targetDegreeId: integer('target_degree_id')
      .notNull()
      .references(() => degrees.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type').notNull(),
    source: text('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow()
  },
  (t) => [
    primaryKey({
      columns: [t.sourceDegreeId, t.targetDegreeId, t.relationshipType]
    })
  ]
)

export type DegreeRelationship = typeof degreeRelationships.$inferSelect
