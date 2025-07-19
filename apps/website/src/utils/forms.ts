import { z } from 'zod'

// Function to get required fields from schema
export function getRequiredFields(schema: z.ZodSchema): string[] {
  try {
    const shape = (schema as any)._def?.shape()
    if (!shape) return []

    return Object.keys(shape).filter((fieldName) => {
      const field = shape[fieldName]
      return !field.isOptional()
    })
  } catch {
    return []
  }
}

// Utility function to check if a field is required in the Zod schema
export function isFieldRequired(
  schema: z.ZodSchema,
  fieldName: string
): boolean {
  try {
    const shape = (schema as any)._def?.shape()
    const field = shape?.[fieldName]

    if (!field) return false

    // Check if field is optional
    return !field.isOptional()
  } catch {
    return false
  }
}
