import { PaginationControls } from '@components'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminChats,
  getAdminUserChatStats,
  type AdminChatsQuery,
  type AdminUserChatStats
} from '@uni-feedback/api-client'
import {
  Badge,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@uni-feedback/ui'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatCost, formatDateTime, truncate } from '../../utils/chatFormat'

type RatingFilter = 'all' | 'not_helpful' | 'helpful' | 'none'

interface UserChatsTabContentProps {
  userId: number
}

/**
 * The AI chat list, scoped to one account. Same columns as the AI Chat page
 * minus the user, with the context chips linking to faculty, degree and
 * course like the chat detail page does.
 */
export function UserChatsTabContent({ userId }: UserChatsTabContentProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')

  const query: AdminChatsQuery = {
    page,
    limit,
    user_id: userId,
    ...(ratingFilter !== 'all' && { rating: ratingFilter })
  }

  const {
    data: response,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-chats', query],
    queryFn: () => getAdminChats(query)
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-chat-stats', userId],
    queryFn: () => getAdminUserChatStats(userId)
  })

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load chats</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {statsLoading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <ChatTotals stats={stats} />
      )}

      <div className="flex gap-4 justify-end">
        <Select
          value={ratingFilter}
          onValueChange={(v) => {
            setRatingFilter(v as RatingFilter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            <SelectItem value="not_helpful">Has thumbs down</SelectItem>
            <SelectItem value="helpful">Has thumbs up</SelectItem>
            <SelectItem value="none">Unrated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading || !response ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading chats...</p>
        </div>
      ) : response.data.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {ratingFilter === 'all'
              ? 'This user has not started any AI chat'
              : 'No chats found'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Last message</TableHead>
                  <TableHead>Chat</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead className="text-right">Msgs</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {response.data.map((chat) => {
                  const contextLinks = [
                    chat.context.facultyId && {
                      to: `/faculties/${chat.context.facultyId}`,
                      label: chat.context.facultyShortName
                    },
                    chat.context.degreeId && {
                      to: `/degrees/${chat.context.degreeId}`,
                      label: chat.context.degreeAcronym
                    },
                    chat.context.courseId && {
                      to: `/courses/${chat.context.courseId}`,
                      label: chat.context.courseAcronym
                    }
                  ].filter(
                    (link): link is { to: string; label: string | null } =>
                      Boolean(link && link.label)
                  )

                  return (
                    <TableRow
                      key={chat.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/chats/${chat.id}`)}
                    >
                      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                        {formatDateTime(chat.lastMessageAt ?? chat.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[420px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {chat.title ??
                              truncate(chat.firstQuestion, 70) ??
                              'Untitled'}
                          </span>
                          {chat.language && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 uppercase"
                            >
                              {chat.language}
                            </Badge>
                          )}
                          {chat.deletedAt && (
                            <Badge className="bg-tint-gray text-tint-gray-fg border-tint-gray-border text-[10px] px-1.5">
                              deleted
                            </Badge>
                          )}
                        </div>
                        {chat.title && chat.firstQuestion && (
                          <p
                            className="text-xs text-muted-foreground truncate"
                            title={chat.firstQuestion}
                          >
                            {truncate(chat.firstQuestion, 110)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {contextLinks.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1"
                            title={chat.context.source ?? undefined}
                          >
                            {contextLinks.map((link, i) => (
                              <span key={link.to} className="inline-flex gap-1">
                                {i > 0 && (
                                  <span className="text-muted-foreground">
                                    ›
                                  </span>
                                )}
                                <Link
                                  to={link.to}
                                  className="hover:text-primaryBlue hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {link.label}
                                </Link>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {chat.messageCount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCost(chat.totalCostMicros)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 text-sm">
                          {chat.helpfulCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-tint-green-fg">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {chat.helpfulCount}
                            </span>
                          )}
                          {chat.notHelpfulCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-tint-red-fg font-medium">
                              <ThumbsDown className="h-3.5 w-3.5" />
                              {chat.notHelpfulCount}
                            </span>
                          )}
                          {chat.helpfulCount === 0 &&
                            chat.notHelpfulCount === 0 && (
                              <span className="text-muted-foreground">–</span>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <PaginationControls
            currentPage={response.page}
            totalPages={response.totalPages}
            pageSize={response.limit}
            total={response.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setLimit(size)
              setPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}

/**
 * The user's share of the AI chat totals, in the same tiles as the AI Chat
 * page's overview so the two read alike.
 */
function ChatTotals({ stats }: { stats: AdminUserChatStats }) {
  const costPerChat = stats.chats
    ? formatCost(stats.costMicros / stats.chats)
    : '–'
  const rated = stats.helpful + stats.notHelpful

  const tiles: { label: string; value: string; hint?: string }[] = [
    {
      label: 'Chats',
      value: String(stats.chats),
      hint: stats.deletedChats
        ? `${stats.deletedChats} deleted by the user`
        : undefined
    },
    {
      label: 'Questions',
      value: String(stats.questions),
      hint: stats.chats
        ? `${(stats.questions / stats.chats).toFixed(1)} per chat`
        : undefined
    },
    {
      label: 'Cost',
      value: formatCost(stats.costMicros),
      hint: stats.chats ? `${costPerChat} per chat` : undefined
    },
    {
      label: 'Ratings',
      value: rated ? `${stats.helpful} up · ${stats.notHelpful} down` : '–',
      hint: rated
        ? `${rated} of ${stats.answers} answers rated`
        : 'no answers rated'
    },
    {
      label: 'Last chat',
      value: stats.lastChatAt ? formatDateTime(stats.lastChatAt) : '–',
      hint: stats.firstChatAt
        ? `first ${formatDateTime(stats.firstChatAt)}`
        : undefined
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="py-3 gap-1">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className="text-2xl font-semibold tabular-nums truncate">
              {tile.value}
            </p>
            {tile.hint && (
              <p
                className="text-xs text-muted-foreground truncate"
                title={tile.hint}
              >
                {tile.hint}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
