import { useEffect, useRef, useState } from 'react'
import type { Lang } from '~/i18n/config'
import { formatGrade } from './content'
import type { AdmissionGradePoint } from './pageTypes'

const HEIGHT = 220
// The right padding holds the latest value, labelled beside its point where
// the line can never run into it
const PAD = { left: 36, right: 52, top: 18, bottom: 26 }

/**
 * The 1ª fase "nota do último colocado" over the years: one series, so no
 * legend (the heading names it), a 2px brand line, recessive grid, the latest
 * value labelled directly, and a tooltip on hover or focus for the rest.
 *
 * Server-rendered SVG in theme tokens, so it themes with the page and is in the
 * HTML. The viewBox follows the rendered width (measured after hydration;
 * 640 until then) so labels stay at their real pixel size on a phone instead of
 * shrinking with the drawing. Years with no grade break the line rather than
 * bridging the gap (Nova FCT has none 2013 to 2020).
 */
export function AdmissionChart({
  series,
  lang,
  label
}: {
  series: AdmissionGradePoint[]
  lang: Lang
  /** Accessible name: what and which years */
  label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const grades = series.map((p) => p.grade)
  const yMin = Math.floor((Math.min(...grades) - 4) / 10) * 10
  const yMax = Math.min(200, Math.ceil((Math.max(...grades) + 4) / 10) * 10)
  const tickStep = yMax - yMin > 50 ? 20 : 10
  const firstYear = series[0].year
  const lastYear = series[series.length - 1].year
  const yearSpan = Math.max(1, lastYear - firstYear)

  const x = (year: number) =>
    PAD.left + ((year - firstYear) / yearSpan) * (width - PAD.left - PAD.right)
  const y = (grade: number) =>
    PAD.top + ((yMax - grade) / (yMax - yMin)) * (HEIGHT - PAD.top - PAD.bottom)

  const ticks: number[] = []
  for (let v = Math.ceil(yMin / tickStep) * tickStep; v <= yMax; v += tickStep)
    ticks.push(v)

  // About one year label per 64px, always keeping the last year
  const maxLabels = Math.max(2, Math.floor((width - PAD.left) / 64))
  const yearStep = Math.ceil((yearSpan + 1) / maxLabels)
  const yearLabels: number[] = []
  for (let yr = lastYear; yr >= firstYear; yr -= yearStep) yearLabels.push(yr)

  // Consecutive years join; a gap starts a new segment
  const segments: AdmissionGradePoint[][] = []
  for (const point of series) {
    const current = segments.at(-1)
    if (current && point.year - current[current.length - 1].year === 1) {
      current.push(point)
    } else {
      segments.push([point])
    }
  }

  const last = series.length - 1
  const shown = active ?? last
  const lastPoint = series[last]
  // Hover tooltip: a labelled box above the point (below near the top),
  // kept inside the plot horizontally
  const tip = active !== null ? series[active] : null
  const tipText = tip ? `${tip.year}: ${formatGrade(tip.grade, lang)}` : ''
  const tipWidth = tipText.length * 7 + 14
  const tipX = tip
    ? Math.min(
        Math.max(x(tip.year) - tipWidth / 2, PAD.left),
        width - PAD.right - tipWidth
      )
    : 0
  const tipY = tip
    ? y(tip.grade) - PAD.top > 34
      ? y(tip.grade) - 32
      : y(tip.grade) + 12
    : 0

  return (
    <div ref={containerRef} className="mt-2 rounded-lg bg-muted p-3">
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        className="block overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={11}
              className="fill-muted-foreground"
            >
              {v}
            </text>
          </g>
        ))}
        {yearLabels.map((yr) => (
          <text
            key={yr}
            x={x(yr)}
            y={HEIGHT - 6}
            textAnchor="middle"
            fontSize={11}
            className="fill-muted-foreground"
          >
            {yr}
          </text>
        ))}
        {segments.map((segment) =>
          segment.length > 1 ? (
            <polyline
              key={segment[0].year}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="stroke-primaryBlue"
              points={segment
                .map((p) => `${x(p.year)},${y(p.grade)}`)
                .join(' ')}
            />
          ) : null
        )}
        {series.map((p, i) => (
          <circle
            key={p.year}
            cx={x(p.year)}
            cy={y(p.grade)}
            r={i === shown ? 5 : 3}
            strokeWidth={2}
            className="fill-primaryBlue stroke-muted"
          />
        ))}
        <text
          x={x(lastPoint.year) + 9}
          y={y(lastPoint.grade) + 4}
          textAnchor="start"
          fontSize={12}
          fontWeight={700}
          className="fill-foreground"
        >
          {formatGrade(lastPoint.grade, lang)}
        </text>
        {tip && (
          <g pointerEvents="none">
            <rect
              x={tipX}
              y={tipY}
              width={tipWidth}
              height={22}
              rx={4}
              className="fill-card stroke-border"
            />
            <text
              x={tipX + tipWidth / 2}
              y={tipY + 15}
              textAnchor="middle"
              fontSize={12}
              fontWeight={600}
              className="fill-foreground"
            >
              {tipText}
            </text>
          </g>
        )}
        {/* Hit targets wider than the marks: a column per year */}
        {series.map((p, i) => {
          const half =
            (width - PAD.left - PAD.right) / Math.max(1, yearSpan) / 2
          return (
            <rect
              key={p.year}
              x={x(p.year) - half}
              y={PAD.top}
              width={half * 2}
              height={HEIGHT - PAD.top - PAD.bottom}
              fill="transparent"
              tabIndex={-1}
              onMouseEnter={() => setActive(i)}
              onTouchStart={() => setActive(i)}
            >
              <title>{`${p.year}: ${formatGrade(p.grade, lang)}`}</title>
            </rect>
          )
        })}
      </svg>
    </div>
  )
}
