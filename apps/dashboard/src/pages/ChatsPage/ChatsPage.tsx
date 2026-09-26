import { PaginationControls } from '@components'
import { useDebouncedSearch } from '@hooks'
import { useQuery } from '@tanstack/react-query'
import {
  getAdminChats,
  type AdminChatsQuery,
  type AdminChatSummary
} from '@uni-feedback/api-client'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
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
import { Bot, Search, Shuffle, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatCost, formatDateTime, truncate } from '../../utils/chatFormat'
import { ChatStatsOverview } from './ChatStatsOverview'

type RatingFilter = 'all' | 'not_helpful' | 'helpful' | 'none'

export function ChatsPage() {
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { searchTerm, setSearchTerm, debouncedSearchTerm } =
    useDebouncedSearch()
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  // Bumped by the shuffle button so a re-shuffle is a new query key, since a
  // random order with the same key would just come back from the cache.
  const [shuffle, setShuffle] = useState(0)

  const query: AdminChatsQuery = {
    page,
    limit,
    ...(debouncedSearchTerm && { email: debouncedSearchTerm }),
    ...(ratingFilter !== 'all' && { rating: ratingFilter }),
    ...(shuffle > 0 && { sort: 'random' as const })
  }

  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['admin-chats', query, shuffle],
    queryFn: () => getAdminChats(query)
  })

  const hasFilters = searchTerm !== '' || ratingFilter !== 'all' || shuffle > 0

  const resetFilters = () => {
    setSearchTerm('')
    setRatingFilter('all')
    setShuffle(0)
    setPage(1)
  }

  // The weekly ritual from the PRD: twenty random chats, read by hand.
  const shuffleChats = () => {
    setPage(1)
    setLimit(20)
    setShuffle((n) => n + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bot className="h-6 w-6" />
        <h1 className="text-2xl font-bold">AI Chat</h1>
        {response && (
          <Badge variant="secondary" className="ml-2">
            {response.total} {response.total === 1 ? 'chat' : 'chats'}
          </Badge>
        )}
      </div>

      <ChatStatsOverview />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg">Chats</CardTitle>
            <Button variant="outline" size="sm" onClick={shuffleChats}>
              <Shuffle className="h-4 w-4 mr-2" />
              {shuffle > 0 ? 'Shuffle again' : '20 random chats'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

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

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-destructive">
                Failed to load chats
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : isLoading || !response ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : response.data.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No chats found</h3>
              <p className="text-muted-foreground mt-1">
                {hasFilters
                  ? 'Try adjusting the filters'
                  : 'Nobody has started a chat yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Last message</TableHead>
                      <TableHead>Chat</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Context</TableHead>
                      <TableHead className="text-right">Msgs</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.data.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        onOpen={() => navigate(`/chats/${chat.id}`)}
                      />
                    ))}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ChatRow({
  chat,
  onOpen
}: {
  chat: AdminChatSummary
  onOpen: () => void
}) {
  const contextParts = [
    chat.context.facultyShortName,
    chat.context.degreeAcronym,
    chat.context.courseAcronym
  ].filter(Boolean)

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onOpen}>
      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
        {formatDateTime(chat.lastMessageAt ?? chat.createdAt)}
      </TableCell>
      <TableCell className="max-w-[420px]">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {chat.title ?? truncate(chat.firstQuestion, 70) ?? 'Untitled'}
          </span>
          {chat.language && (
            <Badge variant="outline" className="text-[10px] px-1.5 uppercase">
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
      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
        {chat.userEmail}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        {contextParts.length > 0 ? (
          <span title={chat.context.source ?? undefined}>
            {contextParts.join(' › ')}
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
          {chat.helpfulCount === 0 && chat.notHelpfulCount === 0 && (
            <span className="text-muted-foreground">–</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
