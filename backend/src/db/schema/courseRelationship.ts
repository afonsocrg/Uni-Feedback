import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text
} from 'drizzle-orm/sqlite-core'
import { courses } from './course'

export const courseRelationships = sqliteTable(
  'course_relationships',
  {
    sourceCourseId: integer('source_course_id')
      .notNull()
      .references(() => courses.id),
    targetCourseId: integer('target_course_id')
      .notNull()
      .references(() => courses.id),
    relationshipType: text('relationship_type').notNull().default('identical'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
      () => new Date()
    )
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.sourceCourseId,
        table.targetCourseId,
        table.relationshipType
      ]
    }),
    // Indexes for faster lookup
    sourceRelationshipIdx: index(
      'idx_course_relationships_source_relationship'
    ).on(table.sourceCourseId, table.relationshipType),
    targetRelationshipIdx: index(
      'idx_course_relationships_target_relationship'
    ).on(table.targetCourseId, table.relationshipType)
  })
)

export type CourseRelationship = typeof courseRelationships.$inferSelect
export type NewCourseRelationship = typeof courseRelationships.$inferInsert
