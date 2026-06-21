import { NotFoundError } from '@routes/utils/errorHandling'
import { database } from '@uni-feedback/db'
import {
  academicTerms,
  courseOfferings,
  courses,
  degrees,
  faculties
} from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const AdminDegreeDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  acronym: z.string(),
  type: z.string(),
  description: z.string().nullable(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  courseCount: z.number(),
  reportOptions: z.object({
    curriculumYears: z.array(z.number()),
    terms: z.array(z.string())
  }),
  createdAt: z.string(),
  updatedAt: z.string()
})

export class GetDegreeDetails extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Degrees'],
    summary: 'Get detailed degree information',
    description:
      'Retrieve detailed information for a specific degree including description and course count',
    request: {
      params: z.object({
        id: z.string().transform((val) => parseInt(val, 10))
      })
    },
    responses: {
      '200': {
        description: 'Degree details retrieved successfully',
        content: {
          'application/json': {
            schema: AdminDegreeDetailSchema
          }
        }
      },
      '404': {
        description: 'Degree not found',
        content: {
          'application/json': {
            schema: z.object({
              error: z.string()
            })
          }
        }
      }
    }
  }

  async handle() {
    const { params } = await this.getValidatedData<typeof this.schema>()
    const { id } = params

    // Get degree with faculty info and course count
    const degreeResult = await database()
      .select({
        id: degrees.id,
        name: degrees.name,
        acronym: degrees.acronym,
        type: degrees.type,
        description: degrees.description,
        facultyId: degrees.facultyId,
        facultyName: faculties.name,
        facultyShortName: faculties.shortName,
        createdAt: degrees.createdAt,
        updatedAt: degrees.updatedAt,
        courseCount: sql<number>`(
            SELECT COUNT(*)
            FROM courses
            WHERE courses.degree_id = ${degrees.id}
          )`
      })
      .from(degrees)
      .leftJoin(faculties, eq(degrees.facultyId, faculties.id))
      .where(eq(degrees.id, id))
      .limit(1)

    if (degreeResult.length === 0) {
      throw new NotFoundError('Degree not found')
    }

    const degree = degreeResult[0]

    // Get report options (curriculum years and academic term names) from the
    // offerings of this degree's courses.
    const offeringsResult = await database()
      .select({
        curriculumYear: courseOfferings.curriculumYear,
        termName: academicTerms.name
      })
      .from(courseOfferings)
      .innerJoin(courses, eq(courseOfferings.courseId, courses.id))
      .innerJoin(
        academicTerms,
        eq(courseOfferings.academicTermId, academicTerms.id)
      )
      .where(eq(courses.degreeId, id))

    const curriculumYearSet = new Set<number>()
    const termSet = new Set<string>()

    for (const offering of offeringsResult) {
      if (offering.curriculumYear !== null) {
        curriculumYearSet.add(offering.curriculumYear)
      }
      termSet.add(offering.termName)
    }

    const response = {
      ...degree,
      courseCount: Number(degree.courseCount),
      reportOptions: {
        curriculumYears: Array.from(curriculumYearSet).sort((a, b) => a - b),
        terms: Array.from(termSet).sort()
      },
      createdAt: degree.createdAt?.toISOString() || '',
      updatedAt: degree.updatedAt?.toISOString() || ''
    }

    return Response.json(response)
  }
}
