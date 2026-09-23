export type SseSend = (event: string, data: unknown) => void

/**
 * An SSE response whose writes never fail the work behind it.
 *
 * A turn takes 10 to 40 seconds and students leave mid-answer. Once they do,
 * the stream is cancelled and every `enqueue` throws "Controller is already
 * closed". The progress callback runs inside the tool loop, so that throw used
 * to fail the whole turn, and on a first message `startChat` then deleted the
 * chat: leaving the page lost the conversation. Now a write to a closed
 * connection is dropped, the turn runs to the end, and the answer is saved for
 * when they come back.
 */
export function sseResponse(run: (send: SseSend) => Promise<void>): Response {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    start: async (controller) => {
      const send: SseSend = (event, data) => {
        if (closed) return
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          // Cancelled between the check and the write.
          closed = true
        }
      }

      try {
        await run(send)
      } finally {
        if (!closed) {
          closed = true
          controller.close()
        }
      }
    },
    cancel: () => {
      closed = true
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Nginx buffers proxied responses by default, which would hold the whole
      // stream until the turn finished and quietly undo the point of it.
      'X-Accel-Buffering': 'no'
    }
  })
}
