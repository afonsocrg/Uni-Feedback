import { describe, expect, it } from 'vitest'
import { sseResponse } from '../sse'

describe('sseResponse', () => {
  it('streams events while the client is connected', async () => {
    const response = sseResponse(async (send) => {
      send('answer', { content: 'olá' })
      send('done', {})
    })
    expect(await response.text()).toBe(
      'event: answer\ndata: {"content":"olá"}\n\nevent: done\ndata: {}\n\n'
    )
  })

  it('finishes the work after the client leaves', async () => {
    let finished = false
    let clientLeft!: () => void
    const left = new Promise<void>((resolve) => (clientLeft = resolve))

    const response = sseResponse(async (send) => {
      send('working', { tool: 'search_courses' })
      // The student closes the tab mid-turn.
      await left
      // Progress for a tool the loop is still running, then the answer.
      send('working', { tool: 'get_course_reviews' })
      send('answer', { content: 'saved anyway' })
      finished = true
    })

    const reader = response.body!.getReader()
    await reader.read()
    await reader.cancel()
    clientLeft()

    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(finished).toBe(true)
  })
})
