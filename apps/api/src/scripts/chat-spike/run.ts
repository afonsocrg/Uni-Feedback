/**
 * Phase 0 retrieval spike: the runner.
 *
 * Answers real student questions from the terminal, against the real database,
 * with no chat schema, no API and no UI. The point is to find out whether
 * structured retrieval works before we commit to building any of that.
 *
 * See apps/api/src/scripts/chat-spike/README.md for usage.
 */
import 'dotenv/config'

import { DatabaseContext } from '@uni-feedback/db'
import * as schema from '@uni-feedback/db/schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import postgres from 'postgres'

import { QUESTIONS, type SpikeQuestion } from './questions'
import { TOOL_DEFINITIONS, executeTool } from './tools'

const DEFAULT_MODEL = process.env.CHAT_SPIKE_MODEL || 'openai/gpt-5.6-luna'
const MAX_TOOL_ITERATIONS = 8

const SYSTEM_PROMPT = `You are the Uni Feedback assistant. You help students in Portugal understand university courses and degrees, using ONLY the data available through your tools.

Uni Feedback is a platform where students leave anonymous reviews of their courses. Your knowledge comes from that database: course information (description, ECTS, assessment, curriculum year) and real student reviews.

## Answer first, link second

The student came here for an answer, not for a list of links. Give them the answer.

- Lead with the actual answer to the question they asked, in the first sentence. Never open with "you can find that on this page".
- Synthesise. If they ask whether a course is hard, tell them whether students found it hard, and then support it with quotes. Do not just dump review text and let them work it out.
- **Explain why, not just what.** "Física I is the hardest" is half an answer. Say what students actually complain about. If you ranked courses by rating or workload, fetch the reviews for the top one or two and give the reason. If no review explains why, say so plainly: "students rate it low but nobody explained why".
- THEN, at the end, point to the page(s) where they can read more. Links close the answer, they never replace it.
- If the tools gave you enough to answer, answering with "check this page" is a failure.

**Link every entity you name.** Every single time you mention a course or a degree, make its name a link to its \`pageUrl\`. A list of ten courses is a list of ten links, not a plain list with one link at the bottom. This applies inside tables, bullets and prose.

## Comparisons deserve real depth

When a student compares two courses, degrees or universities, comparing review counts is not an answer. Fetch enough to compare the things they actually care about:

- **What the curricula actually differ on.** Which subjects one covers that the other does not, where the focus differs. This is usually the real answer, and you have the course lists and descriptions to build it.
- **What students say about each**, with quotes.
- Which courses stand out as well-liked or as heavy, on each side.

**Never lead with review counts or average ratings across a whole degree.** A student asking "how does computer science at IST compare with FCT NOVA" does not care that one has 342 reviews and the other 173. They want to know how the two degrees differ and which one students are happier in. Counts are metadata about how much evidence you have, so mention them only to say how confident the comparison is, and only briefly, at the end.

If one side has far less evidence, say so plainly, but still answer with what the curricula show.

These questions are where you can add the most value, because no page on the site answers them. Take the extra tool calls.

## Absolute rules

0. ALWAYS call at least one tool before your first reply. The only exceptions are an off-topic question, or one about data we do not hold at all (see "What you do not have"). This applies even when you intend to ask a clarifying question: look first, then ask about what you actually found.
1. NEVER answer from your own prior knowledge about Portuguese universities. If the tools return nothing, say you do not have that information. This is the most important rule: an invented fact or an invented student opinion destroys the trust the whole platform depends on.
2. Quote student reviews VERBATIM. Never paraphrase a student's opinion into your own words. Introduce quotes plainly, e.g. "One student wrote: ..."
3. Only ever use a URL that a tool gave you, in a pageUrl field. NEVER construct, guess or complete a URL yourself.
4. Always resolve names to IDs with the search tools before fetching. Never guess an ID.
5. If reviews disagree, say students are split. Never flatten a divided course into a single verdict.
6. State how much evidence you have. "Based on 3 reviews" and "based on 40 reviews" deserve different confidence, and the student should be able to tell which they are getting.
7. Never make claims about named individual professors, even if reviews name them.
8. Link ONLY to Uni Feedback pages, from a \`pageUrl\` field. Never link to a university's own website, even when a tool gives you its URL. If a student needs the official page, tell them to check it without linking: our own course page carries that link.
9. "I could not find it" is not "it does not exist". If a search comes back empty, say you could not find it and ask for more detail. Never tell a student a course or degree does not exist: our data is incomplete, and being wrong about this is worse than being unhelpful.
10. Answer the question they asked. If a student asks for the difference between two courses and you only resolved one, you cannot answer: say which one you found, that you could not find the other, and ask. Do not substitute the data you happen to have (ratings, review counts) for the question they actually asked.

## Difficulty is workload, not rating

These are two different measurements and confusing them produces a wrong answer:

- **Rating** is how much students LIKED the course. A low rating means it was badly taught or frustrating, not that it was hard.
- **Workload** is how demanding it was. **The scale is inverted: 1 is very heavy, 5 is very light.** Always read the \`workloadLabel\` field rather than interpreting the number yourself.

So for "which courses are hardest / most demanding / mais difíceis / mais trabalhosas", sort by \`heaviest_workload\`. Use rating only when they ask what students liked or disliked.

## When to ask instead of answering

**Search first, always.** Never ask a clarifying question before calling the tools. You cannot know something is ambiguous until you have looked. A course or degree that sounds like it could be at several universities is very often at exactly one of ours, and asking anyway wastes the student's turn. Look, then decide.

Once you have searched, ask ONE short clarifying question, offering the concrete options you actually found, when:

- **Search returned nothing.** Do not conclude we have no data. Ask for the full course name or the acronym, and for the university if you do not know it. Students often use a variant we do not store.
- **The response has \`relaxedTo\` set.** This means the exact term the student typed found NOTHING, and these results are matches for a shorter, looser term. They are guesses. If the loose results are obviously the same thing (\`LEIC-A\` relaxed to \`LEIC\` returning one degree), just use it and say which one you used. If they are a scattered list of unrelated courses, you have NOT found what they meant: say the exact term found nothing, offer the one or two most plausible candidates, and ask which they meant. **Never build an answer out of relaxed results you do not actually believe.**
- **Search returned several genuinely different things.** "Cálculo" matching Cálculo I, II and III means asking which one. Same for a degree that exists as both a licenciatura and a mestrado: ask which they mean before comparing, since the answer is completely different.
- **The search found the same subject at more than one university.** Then, and only then, ask which university, naming the ones you found. If the search found it at exactly one, just answer.

Do NOT ask when:

- The results are the same course repeated across degrees. A result carrying \`alsoInDegrees\` is ONE course that several degrees share, with shared reviews. Answer about it once and mention the degrees it belongs to.
- The answer is the same whichever option they meant. Just answer, and note it applies to all of them.
- You could answer the most likely reading and check at the end. Prefer "here is X, tell me if you meant Y" over refusing to answer.

Never ask two questions in a row. One clarification, then do your best with what you get.

## Course structure changes from year to year

ECTS, assessment method, whether there is a mandatory exam, and which term a course runs in are all things universities change between years. Our record is what students and we have gathered, and it may lag the current year.

So when your answer leans on those structural fields, close with one short line telling the student these rules change from year to year and are worth confirming on the university's official page. **Do not paste the university's URL** (see rule 8): link to our course page, which carries the official link. Keep it to one sentence, at the end.

Do NOT add this to student opinions. A review is a first-hand account of what someone experienced, and it does not need a disclaimer. This line is about facts that expire, not about doubting our data.

## What you do not have

You have NO data on: entry grades (médias de entrada, notas de corte, última nota de colocação), admission chances, application processes and deadlines, waiting lists, tuition, housing, or career outcomes. If asked, say plainly that Uni Feedback does not have that information yet. Do not guess, and do not offer general advice as a substitute. This is different from an ambiguous question: here the data does not exist at all, so clarifying would waste the student's time.

## Scope

You only discuss Portuguese universities, their degrees and their courses. If asked about anything else (homework help, general study advice, unrelated topics), politely decline in one sentence and say what you can help with instead.

## Style

Answer in the language the student used. Be concise and direct.

When you write in Portuguese, write EUROPEAN Portuguese, the way a student in Lisbon writes. Address the student informally as "tu" ("o teu curso", "se quiseres"), or use impersonal forms. Never write "você", and never use Brazilian phrasing or spelling. Your audience is Portuguese university students and this is immediately obvious to them.

Write plainly. No marketing tone, no em dashes.`

// ---------------------------------------------------------------------------
// OpenRouter types
// ---------------------------------------------------------------------------

interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

interface AssistantMessage {
  role: 'assistant'
  content: string | null
  tool_calls?: ToolCall[]
}

type ChatMessage =
  | { role: 'system' | 'user'; content: string }
  | AssistantMessage
  | { role: 'tool'; tool_call_id: string; content: string }

interface Usage {
  prompt_tokens?: number
  completion_tokens?: number
  cost?: number
}

interface CompletionResponse {
  choices?: Array<{ message?: AssistantMessage; finish_reason?: string }>
  usage?: Usage
  error?: { message?: string }
}

async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  forceToolCall = false
): Promise<CompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in apps/api/.env')

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uni-feedback.com',
        'X-Title': 'Uni Feedback chat spike'
      },
      body: JSON.stringify({
        model,
        messages,
        tools: TOOL_DEFINITIONS,
        // Safety net for "search before you ask". The prompt owns the rule; this
        // only fires on the retry after the model asked a clarifying question
        // without looking anything up. See RETRY_WITHOUT_SEARCH below.
        ...(forceToolCall ? { tool_choice: 'required' } : {}),
        temperature: 0.2,
        usage: { include: true }
      })
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${text}`)
  }
  return (await response.json()) as CompletionResponse
}

// ---------------------------------------------------------------------------
// The agent loop
// ---------------------------------------------------------------------------

interface ToolTrace {
  name: string
  args: unknown
  resultSummary: string
  ms: number
}

/**
 * Prototype of the `chat_message_entities` table in the plan: which database
 * entities a turn touched, and in what capacity.
 *
 * `retrieved` = the system fetched it. `cited` = the answer actually linked to it.
 * Keeping the two apart is what lets us later ask both "what are students asking
 * about" and "what did we actually show them".
 */
interface EntityLink {
  type: 'course' | 'degree' | 'faculty'
  id: number
  relation: 'retrieved' | 'cited'
  label: string | null
}

interface RunResult {
  answer: string
  toolTrace: ToolTrace[]
  entities: EntityLink[]
  askedClarification: boolean
  inputTokens: number
  outputTokens: number
  costUsd: number
  ms: number
  iterations: number
  hitIterationCap: boolean
}

/** Records what each tool returned, so entities can be extracted afterwards. */
interface RawToolResult {
  name: string
  args: Record<string, unknown>
  result: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Walks tool arguments and results for entity ids, then checks which of their
 * pageUrls survived into the final answer.
 */
function extractEntities(raw: RawToolResult[], answer: string): EntityLink[] {
  const retrieved = new Map<string, EntityLink>()
  const urlToKey = new Map<string, string>()

  const add = (
    type: EntityLink['type'],
    id: number,
    label: string | null,
    pageUrl?: unknown
  ) => {
    if (!Number.isInteger(id)) return
    const key = `${type}:${id}`
    const existing = retrieved.get(key)
    if (existing) {
      if (!existing.label && label) existing.label = label
    } else {
      retrieved.set(key, { type, id, relation: 'retrieved', label })
    }
    if (typeof pageUrl === 'string' && pageUrl.length > 0) {
      urlToKey.set(pageUrl, key)
    }
  }

  const visit = (node: unknown, toolName: string) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, toolName)
      return
    }
    if (!isRecord(node)) return

    if (typeof node.courseId === 'number') {
      add(
        'course',
        node.courseId,
        typeof node.name === 'string' ? node.name : null,
        node.pageUrl
      )
    }
    if (typeof node.degreeId === 'number') {
      add(
        'degree',
        node.degreeId,
        typeof node.name === 'string' ? node.name : null,
        node.pageUrl
      )
    }
    // list_faculties rows are the only place a bare `id` means a faculty.
    if (toolName === 'list_faculties' && typeof node.id === 'number') {
      add(
        'faculty',
        node.id,
        typeof node.shortName === 'string' ? node.shortName : null
      )
    }

    for (const value of Object.values(node)) visit(value, toolName)
  }

  for (const { name, args, result } of raw) {
    if (typeof args.course_id === 'number') add('course', args.course_id, null)
    if (typeof args.degree_id === 'number') add('degree', args.degree_id, null)
    visit(result, name)
  }

  const links = [...retrieved.values()]
  for (const [url, key] of urlToKey) {
    if (answer.includes(url)) {
      const entity = retrieved.get(key)
      if (entity) {
        links.push({ ...entity, relation: 'cited' })
      }
    }
  }
  return links
}

/**
 * Detects an answer that puts words in students' mouths.
 *
 * Run 4 regression: once the prompt demanded depth ("explain WHY it is hard",
 * "compare the curricula"), the model started meeting that demand by INVENTING
 * rather than by fetching. Asked to compare IST with FCT NOVA it called only
 * `search_degrees` twice, then wrote "os estudantes destacam a exigência e a
 * profundidade dos cursos" having read zero reviews.
 *
 * This is the failure mode the whole product cannot survive, and it appeared as a
 * side effect of asking for better answers. Depth and grounding pull against each
 * other, so the grounding side needs an enforcement the prompt does not provide.
 */
const ATTRIBUTION_PATTERNS = [
  /\b(alunos|estudantes)\b[^.!?]{0,80}\b(dizem|mencionam|destacam|referem|acham|consideram|queixam|criticam|elogiam|apontam|descrevem|sentem|relatam)/i,
  /\b(segundo|de acordo com) os (alunos|estudantes)\b/i,
  /\bstudents\b[^.!?]{0,80}\b(say|said|mention|describe|note|report|find|found|complain|praise|highlight|feel)/i
]

function attributesOpinionsWithoutReviews(
  answer: string,
  toolTrace: ToolTrace[]
): boolean {
  const fetchedReviews = toolTrace.some((t) => t.name === 'get_course_reviews')
  if (fetchedReviews) return false
  return ATTRIBUTION_PATTERNS.some((re) => re.test(answer))
}

/**
 * Heuristic, not ground truth: an answer that asks something and links nowhere is
 * almost certainly a clarifying question. Good enough to count them across a run;
 * the real implementation should have the model say so explicitly.
 */
function looksLikeClarification(
  answer: string,
  entities: EntityLink[]
): boolean {
  const cited = entities.some((e) => e.relation === 'cited')
  return answer.includes('?') && !cited
}

/** Keeps the console readable without hiding whether a tool found anything. */
function summariseResult(value: unknown): string {
  const json = JSON.stringify(value)
  if (!json) return 'undefined'
  return json.length > 220 ? `${json.slice(0, 220)}…` : json
}

async function answerQuestion(
  model: string,
  question: string,
  verbose: boolean,
  forceFirstTool: boolean
): Promise<RunResult> {
  const started = Date.now()
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question }
  ]

  const toolTrace: ToolTrace[] = []
  const rawResults: RawToolResult[] = []
  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0
  let hitIterationCap = true
  let iterations = 0
  let retriedWithoutSearch = false
  let retriedUngrounded = false
  let forceNextToolCall = false

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    iterations = i + 1
    const completion = await callOpenRouter(model, messages, forceNextToolCall)
    forceNextToolCall = false

    inputTokens += completion.usage?.prompt_tokens ?? 0
    outputTokens += completion.usage?.completion_tokens ?? 0
    costUsd += completion.usage?.cost ?? 0

    const message = completion.choices?.[0]?.message
    if (!message) {
      throw new Error(
        `No message in response: ${JSON.stringify(completion.error ?? completion)}`
      )
    }

    messages.push(message)

    const calls = message.tool_calls ?? []
    if (calls.length === 0) {
      // The model replied without searching. That is fine for a refusal or an
      // off-topic decline, but never for a clarifying question: it cannot know
      // something is ambiguous without looking. Retry once, forcing a tool call.
      //
      // Prompting alone did not hold here (three rewrites failed), but forcing
      // the tool on EVERY first turn made refusals pay for a pointless search.
      // Retrying only in the failure case gets the guarantee for free.
      if (
        forceFirstTool &&
        !retriedWithoutSearch &&
        toolTrace.length === 0 &&
        (message.content ?? '').includes('?')
      ) {
        retriedWithoutSearch = true
        messages.pop()
        forceNextToolCall = true
        continue
      }

      // Second guard: the answer speaks for students without having read any.
      // Send it back once with a specific correction rather than shipping an
      // invented student opinion.
      if (
        !retriedUngrounded &&
        attributesOpinionsWithoutReviews(message.content ?? '', toolTrace)
      ) {
        retriedUngrounded = true
        messages.push({
          role: 'user',
          content:
            'You described what students say or think, but you never called get_course_reviews, so you have not read a single review. Call get_course_reviews for the courses you are describing and rewrite the answer using real quotes, or remove every claim about what students think. Do not describe a university or degree from your own general knowledge.'
        })
        continue
      }

      hitIterationCap = false
      const answer = message.content ?? '(empty answer)'
      const entities = extractEntities(rawResults, answer)
      return {
        answer,
        toolTrace,
        entities,
        askedClarification: looksLikeClarification(answer, entities),
        inputTokens,
        outputTokens,
        costUsd,
        ms: Date.now() - started,
        iterations,
        hitIterationCap
      }
    }

    for (const call of calls) {
      const callStarted = Date.now()
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}') as Record<
          string,
          unknown
        >
      } catch {
        args = {}
      }

      let result: unknown
      try {
        result = await executeTool(call.function.name, args)
      } catch (error) {
        result = {
          error: error instanceof Error ? error.message : String(error)
        }
      }

      const trace: ToolTrace = {
        name: call.function.name,
        args,
        resultSummary: summariseResult(result),
        ms: Date.now() - callStarted
      }
      toolTrace.push(trace)
      rawResults.push({ name: call.function.name, args, result })

      if (verbose) {
        console.log(
          `   🔧 ${trace.name}(${JSON.stringify(args)}) ${trace.ms}ms\n      ${trace.resultSummary}`
        )
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
      })
    }
  }

  const answer = '(hit the tool iteration cap without producing an answer)'
  return {
    answer,
    toolTrace,
    entities: extractEntities(rawResults, answer),
    askedClarification: false,
    inputTokens,
    outputTokens,
    costUsd,
    ms: Date.now() - started,
    iterations,
    hitIterationCap
  }
}

// ---------------------------------------------------------------------------
// Interaction log
// ---------------------------------------------------------------------------

/**
 * Append-only log of every interaction, across every run.
 *
 * This is the Phase 0 stand-in for `chats` + `chat_messages` +
 * `chat_message_entities`. One JSON object per line: greppable, appendable, and
 * analysable with jq without parsing markdown. When Phase 1 builds the real
 * tables, this record is what they have to be able to reproduce.
 *
 * The per-run markdown report stays: it is for reading. This is for counting.
 */
const LOG_PATH = join(process.cwd(), 'chat-spike-results', 'interactions.jsonl')

interface LoggedInteraction {
  timestamp: string
  runId: string
  model: string
  questionId: number | null
  expected: string | null
  question: string
  answer: string
  askedClarification: boolean
  entities: EntityLink[]
  toolCalls: Array<{
    name: string
    args: unknown
    ms: number
    resultSummary: string
  }>
  metadata: {
    inputTokens: number
    outputTokens: number
    costUsd: number
    latencyMs: number
    iterations: number
    hitIterationCap: boolean
  }
}

async function logInteraction(entry: LoggedInteraction): Promise<void> {
  await mkdir(dirname(LOG_PATH), { recursive: true })
  await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8')
}

function toLogEntry(
  runId: string,
  model: string,
  question: string,
  result: RunResult,
  spikeQuestion: SpikeQuestion | null
): LoggedInteraction {
  return {
    timestamp: new Date().toISOString(),
    runId,
    model,
    questionId: spikeQuestion?.id ?? null,
    expected: spikeQuestion?.expect ?? null,
    question,
    answer: result.answer,
    askedClarification: result.askedClarification,
    entities: result.entities,
    toolCalls: result.toolTrace.map((t) => ({
      name: t.name,
      args: t.args,
      ms: t.ms,
      resultSummary: t.resultSummary
    })),
    metadata: {
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      latencyMs: result.ms,
      iterations: result.iterations,
      hitIterationCap: result.hitIterationCap
    }
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Cli {
  model: string
  adHoc: string | null
  only: number[] | null
  verbose: boolean
  forceFirstTool: boolean
}

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {
    model: DEFAULT_MODEL,
    adHoc: null,
    only: null,
    verbose: true,
    forceFirstTool: true
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--model') cli.model = argv[++i]
    else if (arg === '--only')
      cli.only = argv[++i]
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !Number.isNaN(n))
    else if (arg === '--quiet') cli.verbose = false
    else if (arg === '--no-search-retry') cli.forceFirstTool = false
    else if (!arg.startsWith('--')) cli.adHoc = arg
  }
  return cli
}

function buildReport(
  runId: string,
  model: string,
  rows: Array<{ question: SpikeQuestion; result: RunResult }>
): string {
  const lines: string[] = []
  lines.push(`# Chat spike run`)
  lines.push('')
  lines.push(`Model: \`${model}\``)
  lines.push('')
  lines.push(`Run: \`${runId}\``)
  lines.push('')
  lines.push(
    '`expect` is what we predicted before running. Fill in the verdict column by hand after reading every answer. The disagreements between expectation and reality are the output of Phase 0.'
  )
  lines.push('')
  lines.push(
    '| # | Expect | Verdict (fill in) | Asked? | Tools | Cited | Tokens in/out | Cost | Time |'
  )
  lines.push('|---|---|---|---|---|---|---|---|---|')
  for (const { question, result } of rows) {
    const cited = result.entities.filter((e) => e.relation === 'cited').length
    lines.push(
      `| ${question.id} | ${question.expect} | | ${result.askedClarification ? 'yes' : ''} | ${result.toolTrace.length} | ${cited} | ${result.inputTokens}/${result.outputTokens} | $${result.costUsd.toFixed(4)} | ${(result.ms / 1000).toFixed(1)}s |`
    )
  }

  const totalCost = rows.reduce((sum, r) => sum + r.result.costUsd, 0)
  const totalMs = rows.reduce((sum, r) => sum + r.result.ms, 0)
  lines.push('')
  lines.push(
    `**Totals:** $${totalCost.toFixed(4)} for ${rows.length} questions, avg ${(totalMs / rows.length / 1000).toFixed(1)}s per answer.`
  )
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const { question, result } of rows) {
    lines.push(`## ${question.id}. ${question.question}`)
    lines.push('')
    lines.push(`- **Expected:** ${question.expect} (theme: ${question.theme})`)
    lines.push(`- **Why this question:** ${question.note}`)
    lines.push(
      `- **Cost:** $${result.costUsd.toFixed(4)} | ${result.inputTokens} in / ${result.outputTokens} out | ${(result.ms / 1000).toFixed(1)}s`
    )
    if (result.hitIterationCap) {
      lines.push(`- ⚠️ **Hit the ${MAX_TOOL_ITERATIONS}-iteration cap**`)
    }
    lines.push('')
    lines.push('**Tool calls**')
    lines.push('')
    if (result.toolTrace.length === 0) {
      lines.push('_None._')
    } else {
      for (const trace of result.toolTrace) {
        lines.push(
          `1. \`${trace.name}(${JSON.stringify(trace.args)})\` (${trace.ms}ms)`
        )
        lines.push(`   - \`${trace.resultSummary}\``)
      }
    }
    lines.push('')
    const retrieved = result.entities.filter((e) => e.relation === 'retrieved')
    const cited = result.entities.filter((e) => e.relation === 'cited')
    lines.push('**Entities**')
    lines.push('')
    lines.push(
      `- retrieved: ${retrieved.length === 0 ? '_none_' : retrieved.map((e) => `${e.type}:${e.id}${e.label ? ` (${e.label})` : ''}`).join(', ')}`
    )
    lines.push(
      `- cited: ${cited.length === 0 ? '_none_' : cited.map((e) => `${e.type}:${e.id}`).join(', ')}`
    )
    if (result.askedClarification) {
      lines.push('- asked a clarifying question (heuristic)')
    }
    lines.push('')
    lines.push('**Answer**')
    lines.push('')
    lines.push(result.answer)
    lines.push('')
    lines.push(
      '**Verdict:** _(correct / grounded / cites a real page? write it here)_'
    )
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

async function main() {
  const cli = parseArgs(process.argv.slice(2))

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL not set. Run from apps/api with a .env present.'
    )
  }

  const runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}`
  const sql = postgres(process.env.DATABASE_URL, { max: 4 })
  const db = drizzle(sql, { schema })

  try {
    await DatabaseContext.run(db, async () => {
      console.log(`\n🧪 Chat spike | model: ${cli.model} | run ${runId}\n`)

      if (cli.adHoc) {
        const result = await answerQuestion(
          cli.model,
          cli.adHoc,
          cli.verbose,
          cli.forceFirstTool
        )
        await logInteraction(
          toLogEntry(runId, cli.model, cli.adHoc, result, null)
        )
        console.log(`\n${result.answer}\n`)
        console.log(
          `(${result.toolTrace.length} tool calls, ${result.inputTokens} in / ${result.outputTokens} out, $${result.costUsd.toFixed(4)}, ${(result.ms / 1000).toFixed(1)}s)\n`
        )
        return
      }

      const selected = cli.only
        ? QUESTIONS.filter((q) => cli.only?.includes(q.id))
        : QUESTIONS

      const rows: Array<{ question: SpikeQuestion; result: RunResult }> = []

      for (const question of selected) {
        console.log(
          `\n[${question.id}/${QUESTIONS.length}] ${question.question}`
        )
        console.log(`   expect: ${question.expect}`)
        try {
          const result = await answerQuestion(
            cli.model,
            question.question,
            cli.verbose,
            cli.forceFirstTool
          )
          rows.push({ question, result })
          await logInteraction(
            toLogEntry(runId, cli.model, question.question, result, question)
          )
          console.log(`\n   ➜ ${result.answer.replace(/\n/g, '\n     ')}\n`)
        } catch (error) {
          console.error(
            `   ❌ ${error instanceof Error ? error.message : error}`
          )
        }
      }

      if (rows.length > 0) {
        // Timestamp-first so runs sort chronologically and nothing is ever
        // overwritten: each report can be annotated by hand and kept.
        const outPath = join(
          process.cwd(),
          'chat-spike-results',
          `${runId.replace(/^run-/, '')}_${cli.model.replace(/[^a-z0-9]/gi, '-')}.md`
        )
        await mkdir(dirname(outPath), { recursive: true })
        await writeFile(outPath, buildReport(runId, cli.model, rows), 'utf8')
        console.log(`\n📄 Report written to ${outPath}`)
        console.log(`📓 Interactions appended to ${LOG_PATH}\n`)
      }
    })
  } finally {
    await sql.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
