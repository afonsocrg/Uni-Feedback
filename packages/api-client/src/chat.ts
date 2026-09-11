import { API_BASE_URL } from './config'
import { MeicFeedbackAPIError } from './errors'
import { apiDelete, apiGet, apiPost, fetchWithRefresh } from './utils'

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

/**
 * What a turn went looking for and did not find.
 *
 * Produced by the server, never by the model: the ask it drives writes rows, and
 * a write that must not happen by accident should not be reachable by a
 * generated tool call.
 */
export type ChatGapKind = 'no_reviews' | 'missing_field' | 'no_courses'

export interface ChatGap {
  kind: ChatGapKind
  field?: 'description' | 'assessment'
  courseId?: number
  courseName?: string
  /** The real page URL, from the tool payload. Never build one client-side. */
  courseUrl?: string
  degreeId?: number
  facultyId?: number
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

export type ChatRefusalCode =
  | 'chat_resting'
  | 'spend_ceiling'
  | 'ip_rate_limit'
  | 'quota'

export interface ChatAccessRequestInput {
  email: string
  facultyIds?: number[]
  otherUniversities?: string
  /**
   * Who they are. Several are allowed on purpose: the options are not on one
   * axis, so "at university" and "wants a master's elsewhere" are both true of
   * the same person.
   */
  roles?: (
    | 'high_school'
    | 'bachelor'
    | 'masters'
    | 'finished'
    | 'applying'
    | 'want_masters'
    | 'changing_university'
    | 'university_not_listed'
    | 'studying_abroad'
    | 'other'
  )[]
  /** The question they typed, when they arrived from one. */
  question?: string
  /** Recorded rather than asked: the UI language they were reading in. */
  locale?: string
  source?: string
}

/**
 * Ask to be told when the chat opens up.
 *
 * Unauthenticated: this is the door for people who cannot sign up at all, since
 * login requires a university email.
 */
export async function requestChatAccess(
  input: ChatAccessRequestInput
): Promise<void> {
  await apiPost('/chat/access-requests', input)
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
  | {
      type: 'answer'
      messageId: number
      content: string
      /** Set when retrieval came back empty, so the UI can offer the right ask. */
      gap: ChatGap | null
    }
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

  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal: options.signal
  }

  // Shares the refresh-and-retry every other call gets from `apiFetch`. This
  // one cannot go through `apiFetch` itself because the response is an SSE
  // stream to be read frame by frame, not a body to parse, but an expired
  // access token has to behave the same here as everywhere else: a student who
  // spends more than 15 minutes reading an answer is still signed in.
  const response = await fetchWithRefresh(url, init)

  // Every gate runs before the stream opens, so refusals arrive as real status
  // codes and carry a message worth showing the student verbatim.
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }))
    // `data` carries the refusal `code`, which is what lets the UI tell a
    // resting chat from a quota from anything else. Without it every refusal is
    // an indistinguishable 403.
    throw new MeicFeedbackAPIError(error.error ?? 'Request failed', {
      status: response.status,
      data: error.data
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
