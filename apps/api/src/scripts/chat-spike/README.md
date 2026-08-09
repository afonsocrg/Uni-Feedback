# Chat spike (Phase 0)

Throwaway. Answers real student questions from the terminal against the real database, with
no chat schema, no API and no UI.

**Purpose:** find out whether structured retrieval (entity resolution + SQL, no pgvector) can
answer real student questions, before committing to build any of it.

Plan: `afonsocrg/prds/2026-08-09_ai_chat.md`, Phase 0.

## Running it

From `apps/api` (needs `DATABASE_URL` and `OPENROUTER_API_KEY` in `apps/api/.env`):

```bash
# the whole 15-question set, writes a markdown report
pnpm exec tsx src/scripts/chat-spike/run.ts

# one ad-hoc question
pnpm exec tsx src/scripts/chat-spike/run.ts "O que dizem os alunos sobre AMS?"

# a subset, by question id
pnpm exec tsx src/scripts/chat-spike/run.ts --only 1,2,7

# try a different model (comparing models IS part of the spike)
pnpm exec tsx src/scripts/chat-spike/run.ts --model anthropic/claude-sonnet-4.5
```

Defaults to `openai/gpt-4o` because that is what `aiService.ts` already uses on this
OpenRouter account. Override with `--model` or `CHAT_SPIKE_MODEL`.

Add `--no-search-retry` to disable the forced-search guard (see "The two harness guards").

## Output

Two files, both under `apps/api/chat-spike-results/` (gitignored):

**`<timestamp>_<model>.md`** is the per-run report. **Never overwritten**: every run writes a new
timestamped file, so reports can be annotated by hand and kept. For reading: every question, its
tool calls, the entities it touched, and the answer, with a blank verdict line to fill in.

Annotated reports worth keeping long-term go in `chat-spike-results/annotated/`.

**`interactions.jsonl`** is the append-only log of every interaction across every run. One JSON
object per line. This is the Phase 0 stand-in for `chats` + `chat_messages` +
`chat_message_entities`, and when Phase 1 builds those tables, this record is what they have to
be able to reproduce. Each line carries:

| Field | What it is |
|---|---|
| `timestamp`, `runId`, `model` | when, which run, which model |
| `questionId`, `expected` | which evaluation question, and what we predicted |
| `question`, `answer` | the turn itself |
| `askedClarification` | heuristic: asked something and linked nowhere |
| `entities[]` | `{type, id, relation, label}`, where relation is `retrieved` or `cited` |
| `toolCalls[]` | name, arguments, duration, truncated result |
| `metadata` | tokens in/out, cost, latency, iterations, whether the cap was hit |

The `retrieved` vs `cited` split is the interesting part, and it is the design being validated:
`retrieved` is what the system fetched, `cited` is what the answer actually linked to. Analyse
with jq or a few lines of Python:

```bash
# what students asked about most
jq -r '.entities[] | select(.relation=="retrieved") | "\(.type) \(.label)"' \
  chat-spike-results/interactions.jsonl | sort | uniq -c | sort -rn | head

# cost per question, most expensive first
jq -r '[.questionId, .metadata.costUsd] | @tsv' \
  chat-spike-results/interactions.jsonl | sort -k2 -rn | head
```

**Read every answer by hand.** No metric substitutes for that at this stage.

Point it at the **local** database first. It only reads, but the local copy is days stale, so
if a coverage number matters, re-check it against production with
`afonsocrg/dev/scripts/query.sh --prod`.

## Files

| File | What it is |
|---|---|
| `tools.ts` | The six retrieval tools plus their function-calling schemas |
| (guards) | `run.ts` holds two harness guards: a forced search retry, and a grounding retry |
| `questions.ts` | The 15-question evaluation set, each tagged with what we expect |
| `run.ts` | The agent loop, CLI and report writer |

## What we are measuring

Four things, in priority order:

1. **Does entity resolution hold up?** "AMS", "Análise Matemática", "análise mat" all have to
   land on the right course. This is the most likely weak link, and nothing downstream works
   without it. `pg_trgm` is not installed in production, so matching is currently `unaccent` +
   `ILIKE` with an exact-acronym boost. If this is what fails, the fix is trigram similarity,
   not a bigger model.
2. **Does it refuse honestly?** The question set deliberately includes things we hold no data
   on: entry grades, cut-offs, application processes. Those are the *highest-volume* real
   student demand (see `afonsocrg/distribution/reddit/student-demand.md`), and the model very
   likely knows plausible-sounding answers from training. If it bluffs on question 7 or 8, the
   feature is not shippable at any level of polish.
3. **Are answers grounded?** Real quotes, real links, no invented student opinions.
4. **What do cost and latency actually look like?** The report totals both per question. This
   is what the quota and the model tiering get sized from.

## Exit criteria

At least 12 of 15 answers are correct, grounded, and cite a real course page, **with zero
fabricated facts or reviews**. A single invented review is a blocking failure regardless of the
other 14, because that is the failure mode that would cost us the trust the platform runs on.

## The two harness guards

Both exist because prompting alone did not hold. Both fire only in the failure case, so they
cost nothing when the prompt works.

**1. Forced search retry.** If the model replies with a question having made zero tool calls, it
retries once with `tool_choice: 'required'`. It cannot know something is ambiguous without
looking. Disable with `--no-search-retry`.

**2. Grounding retry.** If the answer attributes opinions to students ("os alunos dizem…",
"students found…") but `get_course_reviews` was never called, the turn is sent back with a
correction demanding real quotes or the removal of the claim.

The second guard exists because of a regression worth remembering: once the prompt demanded more
depth ("explain WHY it is hard", "compare the curricula"), the model started meeting that demand
by **inventing rather than fetching**. Asked to compare IST with FCT NOVA it called only
`search_degrees` twice and then wrote "os estudantes destacam a exigência e a profundidade dos
cursos" having read zero reviews.

**Depth and grounding pull against each other.** Asking for better answers made fabrication more
likely, not less. Any future prompt change that pushes for richer answers needs the grounding
check re-run against it.

## Known limitations (deliberate)

- No entry grades, admissions or process data. See point 2.
- No conversation memory. Single question in, single answer out. Multi-turn is Phase 2.
- No caching, no quota, no guardrail model. All Phase 2.
