/**
 * Custom error class with a stable HTTP status code so controllers
 * can throw and a global error handler can render a consistent envelope.
 */
export class HttpError extends Error {
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.details = details
  }
}

export const notFound = (resource: string): HttpError =>
  new HttpError(404, `${resource} not found`)

export const badRequest = (message: string, details?: unknown): HttpError =>
  new HttpError(400, message, details)

export const conflict = (message: string): HttpError =>
  new HttpError(409, message)
