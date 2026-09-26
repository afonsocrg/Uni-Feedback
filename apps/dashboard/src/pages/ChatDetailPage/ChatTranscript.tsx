import type {
  AdminChatMessage,
  AdminChatToolCall
} from '@uni-feedback/api-client'
import { Badge, Markdown } from '@uni-feedback/ui'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { formatCost, formatDateTime, formatMs } from '../../utils/chatFormat'

interface ChatTranscriptProps {
  messages: AdminChatMessage[]
}

/**
 * The conversation as the student saw it, with the debug material each answer
 * carries folded underneath. The reading is the point (PRD Phase 4: nothing
 * but reading catches a fluent wrong answer), so the transcript comes first
 * and the tool calls stay one click away rather than in the way.
 */
export function ChatTranscript({ messages }: ChatTranscriptProps) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        This chat has no messages.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {messages.map((message) =>
        message.role === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : message.role === 'assistant' ? (
          <AssistantMessage key={message.id} message={message} />
        ) : (
          <OtherMessage key={message.id} message={message} />
        )
      )}
    </div>
  )
}

function UserMessage({ message }: { message: AdminChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-muted px-4 py-2.5 whitespace-pre-wrap break-words text-foreground">
        {message.content}
      </div>
      <span className="text-xs text-muted-foreground">
        #{message.seq} · {formatDateTime(message.createdAt)}
      </span>
    </div>
  )
}

function AssistantMessage({ message }: { message: AdminChatMessage }) {
  const meta = message.metadata ?? {}
  const toolCalls = Array.isArray(meta.toolCalls) ? meta.toolCalls : []
  const guards = Array.isArray(meta.guardsFired) ? meta.guardsFired : []
  const cited = message.entities.filter((e) => e.relation === 'cited')
  const retrieved = message.entities.filter((e) => e.relation === 'retrieved')

  return (
    <div className="flex flex-col gap-2">
      {/* Tools run before a word of the answer exists, so they read first. */}
      {toolCalls.length > 0 && <ToolCalls calls={toolCalls} />}

      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border px-4 py-3">
        <Markdown className="text-foreground">{message.content}</Markdown>
      </div>

      {/* Signals worth seeing without a click: each one is a reason to read closer. */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>#{message.seq}</span>
        <span>·</span>
        <span>{formatDateTime(message.createdAt)}</span>
        {message.model && (
          <>
            <span>·</span>
            <span>{message.model}</span>
          </>
        )}
        <span>·</span>
        <span>{formatMs(message.latencyMs)}</span>
        <span>·</span>
        <span>
          {message.inputTokens ?? 0} in / {message.outputTokens ?? 0} out
        </span>
        <span>·</span>
        <span>{formatCost(message.costMicros)}</span>
        {typeof meta.contextTokens === 'number' && (
          <>
            <span>·</span>
            <span>ctx {meta.contextTokens}</span>
          </>
        )}
        {guards.map((guard) => (
          <Badge
            key={String(guard)}
            className="bg-tint-amber text-tint-amber-fg border-tint-amber-border text-[10px] px-1.5"
          >
            guard: {String(guard)}
          </Badge>
        ))}
        {meta.hitIterationCap === true && (
          <Badge className="bg-tint-orange text-tint-orange-fg border-tint-orange-border text-[10px] px-1.5">
            iteration cap
          </Badge>
        )}
        {meta.gap && typeof meta.gap === 'object' && (
          <Badge className="bg-tint-purple text-tint-purple-fg border-tint-purple-border text-[10px] px-1.5">
            gap: {String(meta.gap.kind)}
            {'field' in meta.gap && meta.gap.field
              ? ` (${String(meta.gap.field)})`
              : ''}
          </Badge>
        )}
      </div>

      {message.rating && (
        <div
          className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            message.rating.rating === 'not_helpful'
              ? 'bg-tint-red text-tint-red-fg border-tint-red-border'
              : 'bg-tint-green text-tint-green-fg border-tint-green-border'
          }`}
        >
          {message.rating.rating === 'not_helpful' ? (
            <ThumbsDown className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <ThumbsUp className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <div>
            <span className="font-medium">
              {message.rating.rating === 'not_helpful'
                ? 'Not helpful'
                : 'Helpful'}
            </span>
            <span className="opacity-70">
              {' '}
              · {formatDateTime(message.rating.createdAt)}
            </span>
            {message.rating.comment && (
              <p className="mt-1 whitespace-pre-wrap">
                {message.rating.comment}
              </p>
            )}
          </div>
        </div>
      )}

      {(cited.length > 0 || retrieved.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {cited.length > 0 && (
            <span className="text-muted-foreground">Cited:</span>
          )}
          {cited.map((e) => (
            <Badge
              key={`cited-${e.type}-${e.id}`}
              variant="outline"
              className="font-normal"
              title={`${e.type} #${e.id}`}
            >
              {e.label}
            </Badge>
          ))}
          {retrieved.length > 0 && (
            <span className="text-muted-foreground ml-2">
              Retrieved {retrieved.length}
              {cited.length > 0 &&
                ` (${retrieved.length - cited.length} unused)`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function ToolCalls({ calls }: { calls: AdminChatToolCall[] }) {
  return (
    <details className="group max-w-[85%] rounded-md border border-border text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground hover:text-foreground">
        {calls.length} tool {calls.length === 1 ? 'call' : 'calls'} ·{' '}
        {calls.map((c) => c.name).join(', ')}
      </summary>
      <ol className="border-t border-border divide-y divide-border">
        {calls.map((call, i) => (
          <li key={i} className="px-3 py-2 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium">{call.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatMs(call.ms)}
                {call.resultBytes !== undefined &&
                  ` · ${formatBytes(call.resultBytes)} back`}
              </span>
            </div>
            <JsonBlock label="args" value={call.args} />
            {call.result === undefined ? (
              <p className="text-xs text-muted-foreground">
                Result not recorded (answers before 2026-09-25 kept only the
                arguments).
              </p>
            ) : (
              <details className="text-xs">
                <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
                  result{call.resultTruncated ? ' (first 16KB)' : ''}
                </summary>
                <JsonBlock value={call.result} tall />
              </details>
            )}
          </li>
        ))}
      </ol>
    </details>
  )
}

/** A truncated result is stored as a string of JSON; show it as it was cut. */
function JsonBlock({
  label,
  value,
  tall
}: {
  label?: string
  value: unknown
  tall?: boolean
}) {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <pre
      className={`overflow-auto whitespace-pre-wrap break-words rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground ${
        tall ? 'max-h-96' : 'max-h-40'
      }`}
    >
      {label && <span className="text-foreground">{label}: </span>}
      {text}
    </pre>
  )
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`
}

/** Tool or system rows, if any are ever persisted. Shown raw, never hidden. */
function OtherMessage({ message }: { message: AdminChatMessage }) {
  return (
    <details className="rounded-md border border-dashed border-border text-sm">
      <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground">
        #{message.seq} · {message.role} · {formatDateTime(message.createdAt)}
      </summary>
      <pre className="border-t border-border px-3 py-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
        {message.content}
      </pre>
    </details>
  )
}
