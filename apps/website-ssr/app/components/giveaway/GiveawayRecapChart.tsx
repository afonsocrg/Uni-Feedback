import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

// Hardcoded data from database query (2026-01-15 to 2026-02-27)
const chartData = [
  { date: '2026-01-17', IST: 3, 'Nova SBE': 1, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-18', IST: 0, 'Nova SBE': 1, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-19', IST: 0, 'Nova SBE': 10, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-20', IST: 1, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-23', IST: 3, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-27', IST: 0, 'Nova SBE': 1, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-28', IST: 2, 'Nova SBE': 3, 'Nova FCT': 0, Other: 0 },
  { date: '2026-01-31', IST: 1, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-02', IST: 0, 'Nova SBE': 56, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-03', IST: 4, 'Nova SBE': 86, 'Nova FCT': 7, Other: 0 },
  { date: '2026-02-04', IST: 6, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-05', IST: 1, 'Nova SBE': 1, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-06', IST: 0, 'Nova SBE': 5, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-08', IST: 9, 'Nova SBE': 10, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-09', IST: 1, 'Nova SBE': 17, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-10', IST: 4, 'Nova SBE': 14, 'Nova FCT': 41, Other: 0 },
  { date: '2026-02-11', IST: 2, 'Nova SBE': 85, 'Nova FCT': 27, Other: 0 },
  { date: '2026-02-12', IST: 17, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-13', IST: 4, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-14', IST: 3, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-15', IST: 2, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-16', IST: 1, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-17', IST: 8, 'Nova SBE': 0, 'Nova FCT': 18, Other: 0 },
  { date: '2026-02-18', IST: 67, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-19', IST: 51, 'Nova SBE': 11, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-20', IST: 114, 'Nova SBE': 1, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-21', IST: 43, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-22', IST: 25, 'Nova SBE': 0, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-23', IST: 70, 'Nova SBE': 42, 'Nova FCT': 0, Other: 5 },
  { date: '2026-02-24', IST: 18, 'Nova SBE': 12, 'Nova FCT': 0, Other: 6 },
  { date: '2026-02-25', IST: 10, 'Nova SBE': 13, 'Nova FCT': 0, Other: 0 },
  { date: '2026-02-26', IST: 15, 'Nova SBE': 4, 'Nova FCT': 3, Other: 3 },
  { date: '2026-02-27', IST: 4, 'Nova SBE': 8, 'Nova FCT': 29, Other: 0 }
]

// Faculty colors - inspired by datafa.st but for light mode
const COLORS = {
  IST: '#3b82f6', // Blue
  'Nova SBE': '#f97316', // Orange
  'Nova FCT': '#8b5cf6', // Purple
  Other: '#94a3b8' // Gray
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label)
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    })

    const total = payload.reduce(
      (sum: number, entry: any) => sum + entry.value,
      0
    )

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{formattedDate}</p>
        {payload
          .filter((entry: any) => entry.value > 0)
          .map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <p className="text-sm font-semibold">
            Total: <span className="text-primary">{total}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function GiveawayRecapChart() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-center mb-4">
            What We Achieved
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Daily feedback submissions by faculty (Jan 15 - Feb 27, 2026)
          </p>

          <div className="bg-card rounded-xl border p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#d1d5db"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  stroke="#d1d5db"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <ReferenceLine
                  x="2026-02-02"
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Giveaway Announced',
                    position: 'top',
                    fill: '#ef4444',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                />
                <Bar
                  dataKey="IST"
                  stackId="a"
                  fill={COLORS.IST}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Nova SBE"
                  stackId="a"
                  fill={COLORS['Nova SBE']}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Nova FCT"
                  stackId="a"
                  fill={COLORS['Nova FCT']}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Other"
                  stackId="a"
                  fill={COLORS.Other}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Notice how different faculties ramped up at different times -
              reflecting their lecture schedules 📅
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
