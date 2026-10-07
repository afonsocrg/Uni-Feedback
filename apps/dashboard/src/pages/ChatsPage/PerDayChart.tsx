import type { AdminChatStats } from '@uni-feedback/api-client'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger
} from '@uni-feedback/ui'
import { useEffect, useRef, useState } from 'react'
import { formatCost } from '../../utils/chatFormat'

type Day = AdminChatStats['perDay'][number]

type MetricKey =
  | 'chats'
  | 'questions'
  | 'uniqueUsers'
  | 'costMicros'
  | 'notHelpful'

interface Metric {
  key: MetricKey
  label: string
  value: (day: Day) => number
  format: (value: number) => string
}

const METRICS: Metric[] = [
  { key: 'chats', label: 'Chats', value: (d) => d.chats, format: formatCount },
  {
    key: 'questions',
    label: 'Questions',
    value: (d) => d.questions,
    format: formatCount
  },
  {
    key: 'uniqueUsers',
    label: 'Users',
    value: (d) => d.uniqueUsers,
    format: formatCount
  },
  {
    key: 'costMicros',
    label: 'Cost',
    // Plotted in euros so the axis ticks read as money, not micros.
    value: (d) => d.costMicros / 1_000_000,
    format: (euros) => formatCost(Math.round(euros * 1_000_000))
  },
  {
    key: 'notHelpful',
    label: 'Thumbs down',
    value: (d) => d.notHelpful,
    format: formatCount
  }
]

function formatCount(value: number): string {
  return value.toLocaleString('en-GB')
}

/**
 * One series per view, switched by pills: the day-by-day question is always
 * "how did X move", and five side-by-side series would answer none of them.
 * The table stays one click away so every value is reachable without a hover.
 */
export function PerDayChart({ days }: { days: Day[] }) {
  const [metricKey, setMetricKey] = useState<MetricKey>('chats')
  const [showTable, setShowTable] = useState(false)
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0]

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Per day</CardTitle>
          <div className="flex items-center gap-2">
            <Tabs
              value={metricKey}
              onValueChange={(v) => setMetricKey(v as MetricKey)}
            >
              <TabsList>
                {METRICS.map((m) => (
                  <TabsTrigger key={m.key} value={m.key}>
                    {m.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={showTable}
              onClick={() => setShowTable((v) => !v)}
            >
              {showTable ? 'Chart' : 'Table'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showTable ? (
          <PerDayTable days={days} />
        ) : (
          <ColumnChart days={days} metric={metric} />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// The chart
// ---------------------------------------------------------------------------

const HEIGHT = 240
const MARGIN = { top: 20, right: 8, bottom: 28, left: 44 }
const MAX_BAR_WIDTH = 24
const BAR_GAP = 2

interface Tooltip {
  index: number
  x: number
  y: number
}

function ColumnChart({ days, metric }: { days: Day[]; metric: Metric }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(240, Math.floor(entry.contentRect.width)))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = days.map(metric.value)
  const max = Math.max(0, ...values)
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1] || 1

  const plotWidth = width - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const band = days.length ? plotWidth / days.length : plotWidth
  const barWidth = Math.max(2, Math.min(MAX_BAR_WIDTH, band - BAR_GAP))
  const yOf = (value: number) => MARGIN.top + plotHeight * (1 - value / top)
  const baseline = MARGIN.top + plotHeight

  // One label at most: the peak, and only when there is one.
  const peakIndex = max > 0 ? values.indexOf(max) : -1
  const labelEvery = Math.max(
    1,
    Math.ceil(days.length / Math.floor(plotWidth / 64))
  )

  return (
    <div ref={containerRef} className="relative w-full min-w-0 overflow-hidden">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${metric.label} per day`}
        className="block"
      >
        {/* Gridlines and ticks: hairline, recessive, text in text tokens. */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={width - MARGIN.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={yOf(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {metric.format(tick)}
            </text>
          </g>
        ))}

        {days.map((day, i) => {
          const value = values[i]
          const x = MARGIN.left + band * i + (band - barWidth) / 2
          const y = yOf(value)
          const hovered = tooltip?.index === i
          return (
            <g key={day.date}>
              {value > 0 && (
                <path
                  d={columnPath(x, y, barWidth, baseline - y)}
                  className={
                    hovered ? 'fill-primaryBlue opacity-75' : 'fill-primaryBlue'
                  }
                />
              )}
              {i === peakIndex && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-foreground text-[11px] font-medium tabular-nums"
                >
                  {metric.format(value)}
                </text>
              )}
              {i % labelEvery === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={baseline + 16}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {shortDate(day.date)}
                </text>
              )}
              {/* The hit target is the whole band, not the painted bar. */}
              <rect
                x={MARGIN.left + band * i}
                y={MARGIN.top}
                width={band}
                height={plotHeight}
                fill="transparent"
                tabIndex={0}
                aria-label={`${day.date}: ${metric.format(value)} ${metric.label.toLowerCase()}`}
                className="outline-none focus-visible:stroke-ring"
                onPointerEnter={() =>
                  setTooltip({ index: i, x: x + barWidth / 2, y })
                }
                onFocus={() => setTooltip({ index: i, x: x + barWidth / 2, y })}
                onPointerLeave={() => setTooltip(null)}
                onBlur={() => setTooltip(null)}
              />
            </g>
          )
        })}
      </svg>

      {tooltip && (
        // Sits clear of the peak label, which lives 6px above the bar.
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: tooltip.x, top: Math.max(0, tooltip.y - 24) }}
        >
          <div className="font-semibold tabular-nums text-foreground">
            {metric.format(values[tooltip.index])}
          </div>
          <div className="text-muted-foreground">
            {metric.label} · {longDate(days[tooltip.index].date)}
          </div>
        </div>
      )}
    </div>
  )
}

/** A column with 4px rounded top corners and a square base on the baseline. */
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h)
  return [
    `M${x},${y + h}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + w - r}`,
    `Q${x + w},${y} ${x + w},${y + r}`,
    `V${y + h}`,
    'Z'
  ].join(' ')
}

/** Clean tick values (1, 2, 5 × 10^k) from zero to just past the max. */
function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1]
  const rough = max / 4
  const power = Math.pow(10, Math.floor(Math.log10(rough)))
  const step =
    [1, 2, 5, 10].map((m) => m * power).find((s) => s >= rough) ?? power * 10
  const ticks: number[] = []
  for (let v = 0; v < max + step; v += step) {
    ticks.push(Number(v.toPrecision(12)))
  }
  return ticks
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

// ---------------------------------------------------------------------------
// The table view: every value without a hover
// ---------------------------------------------------------------------------

function PerDayTable({ days }: { days: Day[] }) {
  // Newest first: the day you are checking on is today.
  const rows = [...days].reverse()
  return (
    <div className="rounded-md border max-h-[420px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Chats</TableHead>
            <TableHead className="text-right">Questions</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Thumbs down</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((day) => {
            const quiet = day.chats === 0 && day.questions === 0
            return (
              <TableRow
                key={day.date}
                className={quiet ? 'text-muted-foreground' : undefined}
              >
                <TableCell className="font-mono text-xs">{day.date}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {day.chats}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {day.questions}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {day.uniqueUsers}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCost(day.costMicros)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {day.notHelpful > 0 ? (
                    <span className="text-tint-red-fg font-medium">
                      {day.notHelpful}
                    </span>
                  ) : (
                    0
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
