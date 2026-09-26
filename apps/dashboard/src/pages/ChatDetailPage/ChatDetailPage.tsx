import { useQuery } from '@tanstack/react-query'
import { getAdminChatDetails } from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton
} from '@uni-feedback/ui'
import { ArrowLeft, Bot } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InvalidIdError } from '../../components/InvalidIdError'
import { QueryError } from '../../components/QueryError'
import { formatCost, formatDateTime, formatMs } from '../../utils/chatFormat'
import { ChatTranscript } from './ChatTranscript'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const chatId = id && UUID_RE.test(id) ? id : null

  const {
    data: chat,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-chat-details', chatId],
    queryFn: () => getAdminChatDetails(chatId!),
    enabled: chatId !== null
  })

  if (!chatId) {
    return <InvalidIdError entityType="chat" />
  }

  if (error) {
    return (
      <QueryError entityType="chat" error={error} onRetry={() => refetch()} />
    )
  }

  if (isLoading || !chat) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const answers = chat.messages.filter((m) => m.role === 'assistant')
  const avgLatency = answers.length
    ? answers.reduce((sum, m) => sum + (m.latencyMs ?? 0), 0) / answers.length
    : null

  const contextRows: { label: string; value: React.ReactNode }[] = []
  if (chat.context.facultyId) {
    contextRows.push({
      label: 'Faculty',
      value: (
        <Link
          className="text-primaryBlue hover:underline"
          to={`/faculties/${chat.context.facultyId}`}
        >
          {chat.context.facultyShortName ?? chat.context.facultyName}
        </Link>
      )
    })
  }
  if (chat.context.degreeId) {
    contextRows.push({
      label: 'Degree',
      value: (
        <Link
          className="text-primaryBlue hover:underline"
          to={`/degrees/${chat.context.degreeId}`}
        >
          {chat.context.degreeAcronym} · {chat.context.degreeName}
        </Link>
      )
    })
  }
  if (chat.context.courseId) {
    contextRows.push({
      label: 'Course',
      value: (
        <Link
          className="text-primaryBlue hover:underline"
          to={`/courses/${chat.context.courseId}`}
        >
          {chat.context.courseAcronym} · {chat.context.courseName}
        </Link>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/chats')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All chats
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Bot className="h-6 w-6 text-primaryBlue" />
          <h1 className="text-2xl font-bold">
            {chat.title ?? 'Untitled chat'}
          </h1>
          {chat.language && (
            <Badge variant="outline" className="uppercase">
              {chat.language}
            </Badge>
          )}
          {chat.deletedAt && (
            <Badge className="bg-tint-gray text-tint-gray-fg border-tint-gray-border">
              deleted {formatDateTime(chat.deletedAt)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">User</dt>
              <dd>
                {chat.userEmail}
                <span className="text-muted-foreground">
                  {' '}
                  · {chat.userName}
                </span>
              </dd>
              <dt className="text-muted-foreground">Started</dt>
              <dd>{formatDateTime(chat.createdAt)}</dd>
              <dt className="text-muted-foreground">Last message</dt>
              <dd>{formatDateTime(chat.lastMessageAt)}</dd>
              {contextRows.map((row) => (
                <ContextRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                />
              ))}
              <dt className="text-muted-foreground">Entry point</dt>
              <dd>{chat.context.source ?? 'cold start (no context)'}</dd>
              <dt className="text-muted-foreground">Chat id</dt>
              <dd className="font-mono text-xs">{chat.id}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Messages</dt>
              <dd className="tabular-nums">{chat.totals.messageCount}</dd>
              <dt className="text-muted-foreground">Cost</dt>
              <dd className="tabular-nums">
                {formatCost(chat.totals.costMicros)}
              </dd>
              <dt className="text-muted-foreground">Tokens</dt>
              <dd className="tabular-nums">
                {chat.totals.inputTokens} in / {chat.totals.outputTokens} out
              </dd>
              <dt className="text-muted-foreground">Avg latency</dt>
              <dd className="tabular-nums">{formatMs(avgLatency)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatTranscript messages={chat.messages} />
        </CardContent>
      </Card>
    </div>
  )
}

function ContextRow({
  label,
  value
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </>
  )
}
