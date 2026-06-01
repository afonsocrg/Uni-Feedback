// Ambient module declarations (no imports/exports — this must be a script file)

// Markdown file imports (processed by vite plugin)
declare module '*.md' {
  export const markdown: string
  export const html: string
  const content: string
  export default content
}

// recharts is used in GiveawayRecapChart but not yet installed; stub to unblock type-check
declare module 'recharts' {
  import type * as React from 'react'
  export const BarChart: React.ComponentType<
    React.HTMLAttributes<SVGElement> & Record<string, unknown>
  >
  export const Bar: React.ComponentType<Record<string, unknown>>
  export const XAxis: React.ComponentType<Record<string, unknown>>
  export const YAxis: React.ComponentType<Record<string, unknown>>
  export const CartesianGrid: React.ComponentType<Record<string, unknown>>
  export const Tooltip: React.ComponentType<Record<string, unknown>>
  export const ResponsiveContainer: React.ComponentType<
    React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>
  >
  export const Cell: React.ComponentType<Record<string, unknown>>
  export const LabelList: React.ComponentType<Record<string, unknown>>
  export const Legend: React.ComponentType<Record<string, unknown>>
  export const ReferenceLine: React.ComponentType<Record<string, unknown>>
}
