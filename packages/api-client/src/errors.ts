export class MeicFeedbackAPIError extends Error {
  public status?: number
  public requestId?: string
  public data?: any

  constructor(
    message: string,
    options?: {
      status?: number
      requestId?: string
      data?: any
    }
  ) {
    super(message)
    this.name = 'MeicFeedbackAPIError'
    this.status = options?.status
    this.requestId = options?.requestId
    this.data = options?.data
  }
}
