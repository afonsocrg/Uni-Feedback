import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'
import { apiDelete, apiGet, apiPost } from './utils'

export interface ChatSummary {
  /** The opaque public id, which is what URLs address. */
  id: string
  title: string | null
  createdAt: string
  lastMessageAt: string | null
}

export type ChatMessageRating = 'helpful' | 'not_helpful'

export interface ChatMessage {
  id: number
  seq: number
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  /** The caller's own rating, so a reloaded chat shows what they already judged. */
  rating: ChatMessageRating | null
}

export interface ChatScope {
  facultyId?: number
  degreeId?: number
  courseId?: number
  source?: 'course_page' | 'degree_page' | 'manual'
}

export interface ChatDetail {
  id: string
  title: string | null
  createdAt: string
  lastMessageAt: string | null
  context: {
    facultyId: number | null
    degreeId: number | null
    courseId: number | null
    source: string | null
  }
  messages: ChatMessage[]
}

export async function listChats(): Promise<{
  chats: ChatSummary[]
  remainingMessages: number
}> {
  return apiGet('/chat')
}

export async function getChat(chatId: string): Promise<ChatDetail> {
  return apiGet(`/chat/${chatId}`)
}

export async function deleteChat(chatId: string): Promise<void> {
  await apiDelete(`/chat/${chatId}`)
}

export async function rateChatMessage(
  messageId: number,
  rating: ChatMessageRating,
  comment?: string
): Promise<void> {
  await apiPost(`/chat/messages/${messageId}/rating`, { rating, comment })
}

/** Take back a rating. Clicking a selected thumb clears it. */
export async function clearChatMessageRating(messageId: number): Promise<void> {
  await apiDelete(`/chat/messages/${messageId}/rating`)
}

/**
 * Events the answer stream emits, in order.
 *
 * A turn is not one token stream: it is several provider calls with tool
 * execution between them, and the server's guards can restart it. So the stream
 * reports honest progress and then delivers the finished answer, rather than
 * faking a token feed.
 */
export type ChatStreamEvent =
  | { type: 'start'; chatId: string }
  /** First message only: the chat now exists, and this is the id to navigate to. */
  | { type: 'created'; chatId: string; title: string | null }
  | { type: 'working'; tool: string }
  | { type: 'answer'; messageId: number; content: string }
  | {
      type: 'done'
      remainingMessages: number
      latencyMs: number
      toolsUsed: string[]
      guardsFired: string[]
    }
  | { type: 'title'; title: string }
  | { type: 'error'; message: string }

/**
 * Sends a message and yields events as they arrive.
 *
 * Written by hand rather than with EventSource because that API is GET-only and
 * cannot send credentials plus a JSON body.
 */
export async function* sendChatMessage(
  /** null starts a new conversation: the chat is created by this same call. */
  chatId: string | null,
  content: string,
  options: {
    scope?: ChatScope
    language?: 'pt' | 'en'
    signal?: AbortSignal
  } = {}
): AsyncGenerator<ChatStreamEvent> {
  const url = chatId
    ? `${API_BASE_URL}/chat/${chatId}/messages`
    : `${API_BASE_URL}/chat/messages`

  const body = chatId
    ? { content }
    : {
        content,
        language: options.language,
        contextFacultyId: options.scope?.facultyId,
        contextDegreeId: options.scope?.degreeId,
        contextCourseId: options.scope?.courseId,
        contextSource: options.scope?.source
      }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal: options.signal
  })

  // Every gate runs before the stream opens, so refusals arrive as real status
  // codes and carry a message worth showing the student verbatim.
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }))
    throw new MeicFeedbackAPIError(error.error ?? 'Request failed', {
      status: response.status
    })
  }

  if (!response.body) {
    throw new MeicFeedbackAPIError('Streaming is not supported here')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by a blank line. Anything after the last one is
      // a partial frame and stays in the buffer.
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        const event = parseFrame(frame)
        if (event) yield event
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function parseFrame(frame: string): ChatStreamEvent | null {
  let name = ''
  let data = ''

  for (const line of frame.split('\n')) {
    if (line.startsWith('event: ')) name = line.slice(7).trim()
    else if (line.startsWith('data: ')) data += line.slice(6)
  }

  if (!name || !data) return null

  try {
    return { type: name, ...JSON.parse(data) } as ChatStreamEvent
  } catch {
    return null
  }
}
