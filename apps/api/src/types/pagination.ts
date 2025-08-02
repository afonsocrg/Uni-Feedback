import { z } from 'zod'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Common pagination query schema
export const PaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '1', 10)),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '20', 10))
})

// Helper function to create paginated response schemas
export function getPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number()
  })
}
