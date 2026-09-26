import { useQuery } from '@tanstack/react-query'
import {
  getAdminChatStats,
  type AdminChatStats
} from '@uni-feedback/api-client'
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton
} from '@uni-feedback/ui'
import { useState } from 'react'
import { formatCost, formatMs } from '../../utils/chatFormat'
import { PerDayChart } from './PerDayChart'

const WINDOWS = [7, 14, 30, 90]

/**
 * The numbers the PRD says a cost dashboard cannot see sit next to the ones it
 * can: thumbs down, guards, iteration caps and gaps beside chats, users and
 * spend. A quiet cost line with a rising thumbs-down rate is the failure
 * mode worth catching, and it only shows up when both are on one screen.
 */
export function ChatStatsOverview() {
  const [days, setDays] = useState(30)

  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-chat-stats', days],
    queryFn: () => getAdminChatStats(days)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last</span>
          <Select
            value={days.toString()}
            onValueChange={(v) => setDays(parseInt(v, 10))}
          >
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w} value={w.toString()}>
                  {w} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          Failed to load stats:{' '}
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      ) : isLoading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <>
          <KpiGrid stats={stats} />
          <PerDayChart days={stats.perDay} />
        </>
      )}
    </div>
  )
}

function KpiGrid({ stats }: { stats: AdminChatStats }) {
  const w = stats.window
  const all = stats.allTime
  const costPerChat = w.chats ? formatCost(w.costMicros / w.chats) : '–'
  const costPerAnswer = w.answers ? formatCost(w.costMicros / w.answers) : '–'

  // Usage, cost and latency. Quality signals (thumbs down, guards, gaps) live
  // in the chart's metric pills and on each transcript, not up here.
  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: 'Chats', value: String(w.chats), hint: `${all.chats} all time` },
    {
      label: 'Unique users',
      value: String(w.uniqueUsers),
      hint: `${all.uniqueUsers} all time, ${stats.returningUsers} came back`
    },
    {
      label: 'Questions',
      value: String(w.questions),
      hint: `${all.questions} all time`
    },
    {
      label: 'Questions per chat',
      value: w.chats ? (w.questions / w.chats).toFixed(1) : '–',
      hint: 'follow-ups mean the answer was worth pushing on'
    },
    {
      label: 'Cost',
      value: formatCost(w.costMicros),
      hint: `${formatCost(all.costMicros)} all time`
    },
    {
      label: 'Cost per chat',
      value: costPerChat,
      hint: `${costPerAnswer} per answer`
    },
    {
      label: 'Latency p50',
      value: formatMs(stats.latency.p50Ms),
      hint: `p95 ${formatMs(stats.latency.p95Ms)}`
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="py-3 gap-1">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{tile.value}</p>
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
