export interface ValidationError {
  field: string
  message: string
}

export type ValidationErrors = ValidationError[]