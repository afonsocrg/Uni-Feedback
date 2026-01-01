export class MeicFeedbackAPIError extends Error {
  public status?: number
  public requestId?: string

  constructor(
    message: string,
    options?: {
      status?: number
      requestId?: string
    }
  ) {
    super(message)
    this.name = 'MeicFeedbackAPIError'
    this.status = options?.status
    this.requestId = options?.requestId
  }
}
