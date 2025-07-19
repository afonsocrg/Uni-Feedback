// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate
export function getErrorResponse(error: string, status: number = 400) {
  return Response.json({ error }, { status })
}
