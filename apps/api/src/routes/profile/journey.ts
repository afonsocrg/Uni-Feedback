import { requireAuth } from '@middleware'
import { UserDegreeService } from '@services/userDegreeService'
import { OpenAPIRoute } from 'chanfana'
import type { Context } from 'hono'
import { z } from 'zod'

/**
 * "O meu percurso": the student's declared degrees, plus the one-time guess.
 *
 * Shaped as a journey rather than a degree list on purpose: semesters and
 * courses will hang under each degree later without changing this contract.
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

const idParams = z.object({ id: z.coerce.number().int().positive() })

export class GetJourney extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: "Get the current user's degrees",
    description:
      '`degrees` are the ones the student declared, current first. `inferred` is a single guess from their reviews, only present while they have declared nothing and have not answered the guess before.',
    responses: {
      '200': {
        description: 'Journey',
        content: {
          'application/json': {
            schema: z.object({
              degrees: z.array(journeyDegreeSchema),
              inferred: journeyDegreeSchema.nullable()
            })
          }
        }
      },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const { user } = await requireAuth(c)
    return Response.json(await new UserDegreeService().getJourney(user.id))
  }
}

export class AddJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: "Add a degree to the current user's profile",
    description:
      'Also how the inferred guess is confirmed. Saving any degree answers the guess for good.',
    request: {
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
      '401': { description: 'Not authenticated' },
      '404': { description: 'Degree not found' },
      '409': { description: 'Degree already in the profile' }
    }
  }

  async handle(c: Context) {
    const { user } = await requireAuth(c)
    const { body } = await this.getValidatedData<typeof this.schema>()
    const degree = await new UserDegreeService().addDegree(user.id, body)
    return Response.json({ degree }, { status: 201 })
  }
}

export class UpdateJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Change a degree or its years',
    request: {
      params: idParams,
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
      '401': { description: 'Not authenticated' },
      '404': { description: 'Degree not found' },
      '409': { description: 'Degree already in the profile' }
    }
  }

  async handle(c: Context) {
    const { user } = await requireAuth(c)
    const { params, body } = await this.getValidatedData<typeof this.schema>()
    const degree = await new UserDegreeService().updateDegree(
      user.id,
      params.id,
      body
    )
    return Response.json({ degree })
  }
}

export class DeleteJourneyDegree extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: "Remove a degree from the current user's profile",
    request: { params: idParams },
    responses: {
      '200': { description: 'Degree removed' },
      '401': { description: 'Not authenticated' },
      '404': { description: 'Degree not found' }
    }
  }

  async handle(c: Context) {
    const { user } = await requireAuth(c)
    const { params } = await this.getValidatedData<typeof this.schema>()
    await new UserDegreeService().removeDegree(user.id, params.id)
    return Response.json({ message: 'Degree removed' })
  }
}

export class DismissInferredDegree extends OpenAPIRoute {
  schema = {
    tags: ['Auth'],
    summary: 'Reject the inferred degree',
    description:
      '"Não é o meu curso". The guess is never offered again, even if every degree is later removed.',
    responses: {
      '200': { description: 'Guess dismissed' },
      '401': { description: 'Not authenticated' }
    }
  }

  async handle(c: Context) {
    const { user } = await requireAuth(c)
    await new UserDegreeService().resolveInference(user.id)
    return Response.json({ message: 'Guess dismissed' })
  }
}
