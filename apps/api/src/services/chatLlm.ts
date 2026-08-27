import { CHAT_TOOL_DEFINITIONS } from './chatTools'

/**
 * Thin OpenRouter client for the chat.
 *
 * Kept separate from `AIService` because that class is built around one-shot
 * structured extraction (categorise this comment, summarise these reviews) while
 * this needs a multi-turn tool-calling loop with streaming. Merging them would
 * mean bending both.
 */

export interface LlmToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface LlmAssistantMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: LlmToolCall[]
}

export type LlmMessage =
  | { role: 'system' | 'user'; content: string }
  | LlmAssistantMessage
  | { role: 'tool'; tool_call_id: string; content: string }

export interface LlmUsage {
  inputTokens: number
  outputTokens: number
  /** Micro-euros. Integer, because these get summed. */
  costMicros: number
}

export interface LlmCompletion {
  message: LlmAssistantMessage
  usage: LlmUsage
  finishReason: string | null
}

interface RawResponse {
  choices?: Array<{ message?: LlmAssistantMessage; finish_reason?: string }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number }
  error?: { message?: string }
}

export interface CompleteOptions {
  model: string
  messages: LlmMessage[]
  /** Omit tools entirely for non-agentic calls such as title generation. */
  withTools?: boolean
  /** Forces a tool call this turn. Used by the search guard, never by default. */
  forceToolCall?: boolean
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export class ChatLlmClient {
  constructor(private readonly env: Env) {}

  async complete(options: CompleteOptions): Promise<LlmCompletion> {
    const apiKey = this.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

    const body: Record<string, unknown> = {
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.2,
      // OpenRouter only reports cost when asked, and cost per message is what
      // the quota and the model tiering get sized from.
      usage: { include: true }
    }

    if (options.withTools !== false) {
      body.tools = CHAT_TOOL_DEFINITIONS
      if (options.forceToolCall) body.tool_choice = 'required'
    }
    if (options.maxTokens) body.max_tokens = options.maxTokens

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.env.WEBSITE_URL,
          'X-Title': 'Uni Feedback chat'
        },
        body: JSON.stringify(body),
        signal: options.signal
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(
        `OpenRouter ${response.status} ${response.statusText}: ${text}`
      )
    }

    const raw = (await response.json()) as RawResponse
    const message = raw.choices?.[0]?.message
    if (!message) {
      throw new Error(
        `OpenRouter returned no message: ${JSON.stringify(raw.error ?? raw)}`
      )
    }

    return {
      message,
      finishReason: raw.choices?.[0]?.finish_reason ?? null,
      usage: {
        inputTokens: raw.usage?.prompt_tokens ?? 0,
        outputTokens: raw.usage?.completion_tokens ?? 0,
        // OpenRouter reports cost in USD. Stored as integer micro-units so sums
        // never drift; the currency label is nominal at this scale.
        costMicros: Math.round((raw.usage?.cost ?? 0) * 1_000_000)
      }
    }
  }
}
