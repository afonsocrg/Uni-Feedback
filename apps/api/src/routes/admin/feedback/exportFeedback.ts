import { database } from '@uni-feedback/db'
import {
  courses,
  degrees,
  faculties,
  feedback
} from '@uni-feedback/db/schema'
import {
  getFeedbackPermalinkUrl,
  getWorkloadLabel
} from '@uni-feedback/utils'
import { OpenAPIRoute } from 'chanfana'
import { and, eq, gte, isNotNull, isNull, lte, lt, sql } from 'drizzle-orm'
import { IRequest } from 'itty-router'
import Papa from 'papaparse'
import { z } from 'zod'
import { sendFeedbackExportNotification } from '../../../services/telegram'
import { withErrorHandling } from '../../utils'

const ExportFiltersSchema = z.object({
  faculty_id: z.number().optional(),
  degree_id: z.number().optional(),
  course_id: z.number().optional(),
  terms: z.array(z.string()).optional(),
  school_year: z.number().optional(),
  from_school_year: z.number().optional(),
  to_school_year: z.number().optional(),
  rating: z.number().optional(),
  from_rating: z.number().optional(),
  to_rating: z.number().optional(),
  workload_rating: z.number().optional(),
  from_workload_rating: z.number().optional(),
  to_workload_rating: z.number().optional(),
  has_comment: z.boolean().optional(),
  is_approved: z.boolean().nullable().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional()
})

const ExportFeedbackBodySchema = z.object({
  filters: ExportFiltersSchema.optional().default({})
})

function sanitizeComment(comment: string | null): string {
  if (!comment) return ''
  if (['=', '+', '-', '@'].includes(comment[0])) {
    return `'${comment}`
  }
  return comment
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

function workloadToLabel(rating: number): string {
  const labels = ['very-heavy', 'heavy', 'moderate', 'light', 'very-light']
  return labels[rating - 1] || 'unknown'
}

function generateFilename(
  filters: any,
  resourceName: string | null
): string {
  const now = new Date()
  const timestamp = now
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14)

  const parts = [timestamp, 'feedback']

  // Add resource name if available (lowest granularity)
  if (resourceName) {
    parts.push(slugify(resourceName))
  }

  // School year filters
  if (filters.school_year !== undefined) {
    parts.push(`year-${filters.school_year}`)
  } else if (filters.from_school_year !== undefined && filters.to_school_year !== undefined) {
    parts.push(`${filters.from_school_year}-to-${filters.to_school_year}`)
  } else if (filters.from_school_year !== undefined) {
    parts.push(`from-${filters.from_school_year}`)
  } else if (filters.to_school_year !== undefined) {
    parts.push(`to-${filters.to_school_year}`)
  }

  // Rating filters
  if (filters.rating !== undefined) {
    parts.push(`rating-${filters.rating}`)
  } else if (filters.from_rating !== undefined && filters.to_rating !== undefined) {
    parts.push(`rating-${filters.from_rating}-to-${filters.to_rating}`)
  } else if (filters.from_rating !== undefined) {
    parts.push(`rating-from-${filters.from_rating}`)
  } else if (filters.to_rating !== undefined) {
    parts.push(`rating-to-${filters.to_rating}`)
  }

  // Workload rating filters
  if (filters.workload_rating !== undefined) {
    parts.push(`workload-${workloadToLabel(filters.workload_rating)}`)
  } else if (filters.from_workload_rating !== undefined && filters.to_workload_rating !== undefined) {
    parts.push(`workload-${workloadToLabel(filters.from_workload_rating)}-to-${workloadToLabel(filters.to_workload_rating)}`)
  } else if (filters.from_workload_rating !== undefined) {
    parts.push(`workload-from-${workloadToLabel(filters.from_workload_rating)}`)
  } else if (filters.to_workload_rating !== undefined) {
    parts.push(`workload-to-${workloadToLabel(filters.to_workload_rating)}`)
  }

  // Comment filter
  if (filters.has_comment === true) {
    parts.push('with-comments')
  } else if (filters.has_comment === false) {
    parts.push('no-comments')
  }

  // Approval filter
  if (filters.is_approved === true) {
    parts.push('approved')
  } else if (filters.is_approved === false) {
    parts.push('pending')
  }

  // Date range filters
  if (filters.created_after !== undefined) {
    const date = new Date(filters.created_after).toISOString().slice(0, 10)
    parts.push(`after-${date}`)
  }
  if (filters.created_before !== undefined) {
    const date = new Date(filters.created_before).toISOString().slice(0, 10)
    parts.push(`before-${date}`)
  }

  // Terms filter
  if (filters.terms && filters.terms.length > 0) {
    const termsList = filters.terms.map((t: string) => slugify(t)).join('-')
    parts.push(`terms-${termsList}`)
  }

  return parts.join('_') + '.csv'
}

export class ExportFeedback extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Feedback'],
    summary: 'Export feedback as CSV',
    description: 'Export all matching feedback as a CSV file',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ExportFeedbackBodySchema
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'CSV file',
        content: {
          'text/csv': {
            schema: z.string()
          }
        }
      }
    }
  }

  async handle(request: IRequest, env: any, context: any) {
    return withErrorHandling(request, async () => {
      const data = await this.getValidatedData<typeof this.schema>()
      const filters = (data.body as any)?.filters ?? {}

      const {
        faculty_id,
        degree_id,
        course_id,
        terms,
        school_year,
        from_school_year,
        to_school_year,
        rating,
        from_rating,
        to_rating,
        workload_rating,
        from_workload_rating,
        to_workload_rating,
        has_comment,
        is_approved,
        created_after,
        created_before
      } = filters

      // Fetch resource names for filename and notification
      let resourceName: string | null = null
      let courseName: string | null = null
      let degreeName: string | null = null
      let facultyName: string | null = null

      if (course_id !== undefined) {
        const courseData = await database()
          .select({
            courseName: courses.name,
            degreeName: degrees.name,
            facultyName: faculties.name
          })
          .from(courses)
          .leftJoin(degrees, eq(courses.degreeId, degrees.id))
          .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
          .where(eq(courses.id, course_id))
          .limit(1)
        courseName = courseData[0]?.courseName || null
        degreeName = courseData[0]?.degreeName || null
        facultyName = courseData[0]?.facultyName || null
        resourceName = courseName
      } else if (degree_id !== undefined) {
        const degreeData = await database()
          .select({
            degreeName: degrees.name,
            facultyName: faculties.name
          })
          .from(degrees)
          .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
          .where(eq(degrees.id, degree_id))
          .limit(1)
        degreeName = degreeData[0]?.degreeName || null
        facultyName = degreeData[0]?.facultyName || null
        resourceName = degreeName
      } else if (faculty_id !== undefined) {
        const faculty = await database()
          .select({ name: faculties.name })
          .from(faculties)
          .where(eq(faculties.id, faculty_id))
          .limit(1)
        facultyName = faculty[0]?.name || null
        resourceName = facultyName
      }

      // Send Telegram notification (non-blocking)
      const userEmail = context.user?.email || 'unknown'
      sendFeedbackExportNotification(env, {
        userEmail,
        filters: {
          ...filters,
          course_name: courseName,
          degree_name: degreeName,
          faculty_name: facultyName
        }
      }).catch((error) => {
        console.error('Telegram notification failed:', error)
      })

      const conditions = []

      if (course_id !== undefined) {
        conditions.push(eq(feedback.courseId, course_id))
      }

      if (degree_id !== undefined) {
        conditions.push(eq(courses.degreeId, degree_id))
      }

      if (faculty_id !== undefined) {
        conditions.push(eq(degrees.facultyId, faculty_id))
      }

      // Approval filter: null = all, true = approved only (default), false = pending only
      if (is_approved === null) {
        // no filter - include all
      } else if (is_approved === false) {
        conditions.push(isNull(feedback.approvedAt))
      } else {
        // default: only approved
        conditions.push(isNotNull(feedback.approvedAt))
      }

      if (school_year !== undefined) {
        conditions.push(eq(feedback.schoolYear, school_year))
      }

      if (from_school_year !== undefined) {
        conditions.push(gte(feedback.schoolYear, from_school_year))
      }

      if (to_school_year !== undefined) {
        conditions.push(lte(feedback.schoolYear, to_school_year))
      }

      if (rating !== undefined) {
        conditions.push(eq(feedback.rating, rating))
      }

      if (from_rating !== undefined) {
        conditions.push(gte(feedback.rating, from_rating))
      }

      if (to_rating !== undefined) {
        conditions.push(lte(feedback.rating, to_rating))
      }

      if (workload_rating !== undefined) {
        conditions.push(eq(feedback.workloadRating, workload_rating))
      }

      if (from_workload_rating !== undefined) {
        conditions.push(gte(feedback.workloadRating, from_workload_rating))
      }

      if (to_workload_rating !== undefined) {
        conditions.push(lte(feedback.workloadRating, to_workload_rating))
      }

      if (has_comment !== undefined) {
        if (has_comment) {
          conditions.push(
            sql`${feedback.comment} IS NOT NULL AND ${feedback.comment} != ''`
          )
        } else {
          conditions.push(
            sql`${feedback.comment} IS NULL OR ${feedback.comment} = ''`
          )
        }
      }

      if (created_after !== undefined) {
        conditions.push(gte(feedback.createdAt, new Date(created_after)))
      }

      if (created_before !== undefined) {
        conditions.push(lt(feedback.createdAt, new Date(created_before)))
      }

      if (terms !== undefined && terms.length > 0) {
        const placeholders = terms.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(', ')
        conditions.push(
          sql`EXISTS (SELECT 1 FROM json_each(${courses.terms}) WHERE value IN (${sql.raw(placeholders)}))`
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const rows = await database()
        .select({
          faculty_id: faculties.id,
          faculty_name: faculties.name,
          faculty_short_name: faculties.shortName,
          degree_id: degrees.id,
          degree_name: degrees.name,
          degree_acronym: degrees.acronym,
          course_id: courses.id,
          course_name: courses.name,
          course_acronym: courses.acronym,
          feedback_id: feedback.id,
          school_year: feedback.schoolYear,
          rating: feedback.rating,
          workload_rating: feedback.workloadRating,
          comment: feedback.comment
        })
        .from(feedback)
        .leftJoin(courses, eq(feedback.courseId, courses.id))
        .leftJoin(degrees, eq(courses.degreeId, degrees.id))
        .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
        .where(whereClause)

      const csvRows = rows.map((row) => ({
        faculty_id: row.faculty_id,
        faculty_name: row.faculty_name,
        faculty_short_name: row.faculty_short_name,
        degree_id: row.degree_id,
        degree_name: row.degree_name,
        degree_acronym: row.degree_acronym,
        course_id: row.course_id,
        course_name: row.course_name,
        course_acronym: row.course_acronym,
        feedback_id: row.feedback_id,
        school_year: row.school_year,
        rating: row.rating,
        workload_rating:
          row.workload_rating != null
            ? getWorkloadLabel(row.workload_rating)
            : '',
        comment: sanitizeComment(row.comment),
        permalink: getFeedbackPermalinkUrl(
          env.WEBSITE_URL,
          row.course_id,
          row.feedback_id
        )
      }))

      const csv = '\uFEFF' + Papa.unparse(csvRows)
      const filename = generateFilename(filters, resourceName)

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Access-Control-Expose-Headers': 'Content-Disposition'
        }
      })
    })
  }
}
