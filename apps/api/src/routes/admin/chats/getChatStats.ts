import { database } from '@uni-feedback/db'
import { OpenAPIRoute } from 'chanfana'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const ChatStatsQuerySchema = z.object({
  /** Window in days for the per-day series and the windowed totals. */
  days: z
    .string()
    .optional()
    .transform((val) => {
      const n = val ? parseInt(val, 10) : 30
      return Number.isFinite(n) && n > 0 ? Math.min(n, 365) : 30
    })
})

const TotalsSchema = z.object({
  chats: z.number(),
  deletedChats: z.number(),
  uniqueUsers: z.number(),
  questions: z.number(),
  answers: z.number(),
  costMicros: z.number(),
  helpful: z.number(),
  notHelpful: z.number()
})

const CountSchema = z.object({ key: z.string(), count: z.number() })

export const AdminChatStatsSchema = z.object({
  days: z.number(),
  allTime: TotalsSchema,
  window: TotalsSchema,
  latency: z.object({
    p50Ms: z.number().nullable(),
    p95Ms: z.number().nullable()
  }),
  quality: z.object({
    guardsFired: z.number(),
    hitIterationCap: z.number(),
    gaps: z.array(CountSchema)
  }),
  perDay: z.array(
    z.object({
      date: z.string(),
      chats: z.number(),
      questions: z.number(),
      uniqueUsers: z.number(),
      costMicros: z.number(),
      notHelpful: z.number()
    })
  ),
  byLanguage: z.array(CountSchema),
  byContextSource: z.array(CountSchema),
  topTools: z.array(CountSchema),
  topCited: z.array(
    z.object({
      type: z.string(),
      id: z.number(),
      label: z.string(),
      count: z.number()
    })
  ),
  returningUsers: z.number()
})

type Row = Record<string, unknown>
const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))
const numOrNull = (v: unknown) =>
  v === null || v === undefined ? null : Number(v)

export class GetChatStats extends OpenAPIRoute {
  schema = {
    tags: ['Admin - Chats'],
    summary: 'Usage, cost and quality stats for the AI chat',
    description:
      'Totals, a per-day series, and the quality signals that a cost dashboard cannot see: guards fired, iteration caps, gaps, thumbs down. Windowed by `days` (default 30).',
    request: { query: ChatStatsQuerySchema },
    responses: {
      '200': {
        description: 'Stats computed',
        content: { 'application/json': { schema: AdminChatStatsSchema } }
      }
    }
  }

  async handle() {
    const { query } = await this.getValidatedData<typeof this.schema>()
    const days = query.days
    const db = database()
    const since = sql`now() - make_interval(days => ${days})`

    // One aggregate row per scope. `filter` keeps the two scopes in one scan.
    const totalsSql = (windowed: boolean) => {
      const chatWhere = windowed ? sql`c.created_at >= ${since}` : sql`true`
      const msgWhere = windowed ? sql`m.created_at >= ${since}` : sql`true`
      return sql`
        select
          (select count(*)::int from chats c where ${chatWhere}) as chats,
          (select count(*)::int from chats c where ${chatWhere} and c.deleted_at is not null) as deleted_chats,
          (select count(distinct c.user_id)::int from chats c where ${chatWhere}) as unique_users,
          (select count(*)::int from chat_messages m where ${msgWhere} and m.role = 'user') as questions,
          (select count(*)::int from chat_messages m where ${msgWhere} and m.role = 'assistant') as answers,
          (select coalesce(sum(m.cost_micros), 0)::bigint from chat_messages m where ${msgWhere}) as cost_micros,
          (select count(*)::int from chat_message_feedback f join chat_messages m on m.id = f.message_id where ${msgWhere} and f.rating = 'helpful') as helpful,
          (select count(*)::int from chat_message_feedback f join chat_messages m on m.id = f.message_id where ${msgWhere} and f.rating = 'not_helpful') as not_helpful
      `
    }

    const [
      [allTimeRow],
      [windowRow],
      [latencyRow],
      [qualityRow],
      gapRows,
      perDayRows,
      languageRows,
      sourceRows,
      toolRows,
      citedRows,
      [returningRow]
    ] = await Promise.all([
      db.execute<Row>(totalsSql(false)),
      db.execute<Row>(totalsSql(true)),
      db.execute<Row>(sql`
        select
          percentile_cont(0.5) within group (order by latency_ms) as p50,
          percentile_cont(0.95) within group (order by latency_ms) as p95
        from chat_messages
        where role = 'assistant' and latency_ms is not null and created_at >= ${since}
      `),
      db.execute<Row>(sql`
        select
          count(*) filter (where jsonb_typeof(metadata->'guardsFired') = 'array' and jsonb_array_length(metadata->'guardsFired') > 0)::int as guards_fired,
          count(*) filter (where (metadata->>'hitIterationCap') = 'true')::int as hit_iteration_cap
        from chat_messages
        where role = 'assistant' and created_at >= ${since}
      `),
      db.execute<Row>(sql`
        select metadata->'gap'->>'kind' as key, count(*)::int as count
        from chat_messages
        where role = 'assistant' and created_at >= ${since}
          and metadata->'gap' is not null and jsonb_typeof(metadata->'gap') = 'object'
        group by 1 order by 2 desc
      `),
      // Every day in the window, zero-filled, so a quiet day is a row rather
      // than a hole the reader has to notice.
      db.execute<Row>(sql`
        with days as (
          select generate_series(
            (now() - make_interval(days => ${days - 1}))::date,
            now()::date,
            interval '1 day'
          )::date as day
        ),
        chat_days as (
          select created_at::date as day, count(*)::int as chats
          from chats where created_at >= ${since} group by 1
        ),
        msg_days as (
          select m.created_at::date as day,
            count(*) filter (where m.role = 'user')::int as questions,
            count(distinct c.user_id) filter (where m.role = 'user')::int as unique_users,
            coalesce(sum(m.cost_micros), 0)::bigint as cost_micros
          from chat_messages m join chats c on c.id = m.chat_id
          where m.created_at >= ${since} group by 1
        ),
        rating_days as (
          select f.created_at::date as day,
            count(*) filter (where f.rating = 'not_helpful')::int as not_helpful
          from chat_message_feedback f where f.created_at >= ${since} group by 1
        )
        select d.day::text as date,
          coalesce(cd.chats, 0) as chats,
          coalesce(md.questions, 0) as questions,
          coalesce(md.unique_users, 0) as unique_users,
          coalesce(md.cost_micros, 0) as cost_micros,
          coalesce(rd.not_helpful, 0) as not_helpful
        from days d
        left join chat_days cd on cd.day = d.day
        left join msg_days md on md.day = d.day
        left join rating_days rd on rd.day = d.day
        order by d.day
      `),
      db.execute<Row>(sql`
        select coalesce(language, 'unknown') as key, count(*)::int as count
        from chats where created_at >= ${since} group by 1 order by 2 desc
      `),
      db.execute<Row>(sql`
        select coalesce(context_source, 'none') as key, count(*)::int as count
        from chats where created_at >= ${since} group by 1 order by 2 desc
      `),
      db.execute<Row>(sql`
        select call->>'name' as key, count(*)::int as count
        from chat_messages m,
          jsonb_array_elements(case when jsonb_typeof(m.metadata->'toolCalls') = 'array' then m.metadata->'toolCalls' else '[]'::jsonb end) as call
        where m.role = 'assistant' and m.created_at >= ${since}
        group by 1 order by 2 desc limit 10
      `),
      db.execute<Row>(sql`
        select e.entity_type::text as type, e.entity_id as id, count(*)::int as count,
          case e.entity_type
            when 'course' then (select co.acronym || ' · ' || co.name from courses co where co.id = e.entity_id)
            when 'degree' then (select dg.acronym || ' · ' || dg.name from degrees dg where dg.id = e.entity_id)
            when 'faculty' then (select fa.short_name from faculties fa where fa.id = e.entity_id)
          end as label
        from chat_message_entities e
        where e.relation = 'cited' and e.created_at >= ${since}
          and e.entity_type in ('course', 'degree', 'faculty')
        group by e.entity_type, e.entity_id
        order by 3 desc limit 10
      `),
      db.execute<Row>(sql`
        select count(*)::int as returning_users
        from (select user_id from chats group by user_id having count(*) > 1) u
      `)
    ])

    const totals = (row: Row) => ({
      chats: num(row.chats),
      deletedChats: num(row.deleted_chats),
      uniqueUsers: num(row.unique_users),
      questions: num(row.questions),
      answers: num(row.answers),
      costMicros: num(row.cost_micros),
      helpful: num(row.helpful),
      notHelpful: num(row.not_helpful)
    })

    const counts = (rows: Row[]) =>
      rows.map((r) => ({
        key: String(r.key ?? 'unknown'),
        count: num(r.count)
      }))

    return Response.json({
      days,
      allTime: totals(allTimeRow),
      window: totals(windowRow),
      latency: {
        p50Ms: numOrNull(latencyRow?.p50),
        p95Ms: numOrNull(latencyRow?.p95)
      },
      quality: {
        guardsFired: num(qualityRow?.guards_fired),
        hitIterationCap: num(qualityRow?.hit_iteration_cap),
        gaps: counts(gapRows)
      },
      perDay: perDayRows.map((r) => ({
        date: String(r.date),
        chats: num(r.chats),
        questions: num(r.questions),
        uniqueUsers: num(r.unique_users),
        costMicros: num(r.cost_micros),
        notHelpful: num(r.not_helpful)
      })),
      byLanguage: counts(languageRows),
      byContextSource: counts(sourceRows),
      topTools: counts(toolRows),
      topCited: citedRows.map((r) => ({
        type: String(r.type),
        id: num(r.id),
        label: r.label ? String(r.label) : `${r.type} #${r.id}`,
        count: num(r.count)
      })),
      returningUsers: num(returningRow?.returning_users)
    })
  }
}
