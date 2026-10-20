import { NotFoundError } from '@routes/utils/errorHandling'
import { UserDegreeService } from '@services/userDegreeService'
import { database } from '@uni-feedback/db'
import { users } from '@uni-feedback/db/schema'
import { OpenAPIRoute } from 'chanfana'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * A user's academic journey ("O meu percurso"), as an admin sees it: the
 * declared degrees only. The inferred guess is a student-facing prompt, not
 * data, so it is left out here.
 *
 * Admin writes go through `UserDegreeService` like the student's own, so the
 * same rules hold, including that saving a degree answers the guess.
 */

const journeyDegreeSchema = z.object({
  id: z.number().nullable(),
  degreeId: z.number(),
  degreeName: z.string(),
  degreeAcronym: z.string(),
  degreeType: z.string(),
  facultyId: z.number(),
  facultyName: z.string(),
  facultyShortName: z.string(),
  facultyLogo: z.string().nullable(),
  startSchoolYear: z.number().nullable(),
  endSchoolYear: z.number().nullable()
})

// School years are start years: 2025 means 2025/2026.
const degreeInputSchema = z.object({
  degreeId: z.number().int().positive(),
  startSchoolYear: z.number().int().nullable().optional(),
  endSchoolYear: z.number().int().nullable().optional()
})

const userParams = z.object({ id: z.coerce.number().int().positive() })
const userDegreeParams = userParams.extend({
  userDegreeId: z.coerce.number().int().positive()
})

async function assertUserExists(id: number) {
  const [user] = await database()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  if (!user) throw new NotFoundError('User not found')
}

export class GetUserJourney extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: "List a user's declared degrees",
    request: { params: userParams },
    responses: {
      '200': {
        description: 'Declared degrees, current first',
        content: {
          'application/json': {
            schema: z.object({ degrees: z.array(journeyDegreeSchema) })
          }
        }
      },
      '404': { description: 'User not found' }
    }
  }

  async handle() {
    const { params } = await this.getValidatedData<typeof this.schema>()
    await assertUserExists(params.id)
    const degrees = await new UserDegreeService().listDegrees(params.id)
    return Response.json({ degrees })
  }
}

export class AddUserJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: "Add a degree to a user's journey",
    request: {
      params: userParams,
      body: { content: { 'application/json': { schema: degreeInputSchema } } }
    },
    responses: {
      '201': {
        description: 'Degree added',
        content: {
          'application/json': {
            schema: z.object({ degree: journeyDegreeSchema })
          }
        }
      },
      '400': { description: 'Invalid school years' },
      '404': { description: 'User or degree not found' },
      '409': { description: 'Degree already in the journey' }
    }
  }

  async handle() {
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    await assertUserExists(params.id)
    const degree = await new UserDegreeService().addDegree(params.id, body)
    return Response.json({ degree }, { status: 201 })
  }
}

export class UpdateUserJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: "Change a degree or its years in a user's journey",
    request: {
      params: userDegreeParams,
      body: { content: { 'application/json': { schema: degreeInputSchema } } }
    },
    responses: {
      '200': {
        description: 'Degree updated',
        content: {
          'application/json': {
            schema: z.object({ degree: journeyDegreeSchema })
          }
        }
      },
      '400': { description: 'Invalid school years' },
      '404': { description: 'User or degree not found' },
      '409': { description: 'Degree already in the journey' }
    }
  }

  async handle() {
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    await assertUserExists(params.id)
    const degree = await new UserDegreeService().updateDegree(
      params.id,
      params.userDegreeId,
      body
    )
    return Response.json({ degree })
  }
}

export class DeleteUserJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Users'],
    summary: "Remove a degree from a user's journey",
    request: { params: userDegreeParams },
    responses: {
      '200': { description: 'Degree removed' },
      '404': { description: 'User or degree not found' }
    }
  }

  async handle() {
    const { params } = await this.getValidatedData<typeof this.schema>()
    await assertUserExists(params.id)
    await new UserDegreeService().removeDegree(params.id, params.userDegreeId)
    return Response.json({ message: 'Degree removed' })
  }
}
