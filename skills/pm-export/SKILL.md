---
name: pm-export
description: Use when the user asks for the plan, roadmap, board, or project status as JSON, asks to export or update the current status, or a tool, script, or dashboard needs the plan in a machine-readable form. Writes planning.json and its schema inside the PM root in one fixed, schema-validated format, or checks them against the schema without writing.
---

# pm-export

Write the whole PM state as one JSON document, the same shape on every run,
and keep it valid against the schema that ships with this skill. Other tools
read it; the Markdown files stay the source of truth.

Follow the Non-interruption rules, Shared definitions, Persistence, Asking
the user, and Communication contract in the pm-skills section of the agent
instructions file (`AGENTS.md` or `CLAUDE.md`). PM root is its `PM state
directory` setting (default `planning/`).

## Modes

| Mode | When | Effect |
| --- | --- | --- |
| `write` | Default: "export the plan", "update the status JSON" | Regenerate `planning.json` and its schema; one PM commit |
| `check` | "is the export current?", "validate the export", or during a workflow | Read-only: validate and compare; write nothing |

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- Write in the main worktree, never in a feature worktree.
- The **Export file** is derived (Shared definitions): never hand-edit it,
  never read it as PM state, and never resolve a disagreement in its favour.
  When the JSON and the Markdown differ, the Markdown is correct and the
  export is stale.
- During an active workflow only `check` may run (Non-interruption rule 3).
  `write` applies Non-interruption rule 4.
- Export only what the PM files hold. Never add environment values, tokens,
  source-code excerpts, or anything not in the PM root.
- Never edit any other PM file. This skill reads them all and writes two.
- Anyone can validate the result with
  `bunx ajv-cli@5 validate -s "<PM root>/planning.schema.json" -d "<PM root>/planning.json" --spec=draft2020`.
  A warning that the `date-time` format is unknown is expected and harmless.

## Format rules (identical on every run)

1. Key order is the order in the field map below, which matches
   `references/planning.schema.json`. Never sort, never add a key.
2. Every key is present. Empty is `null`; an empty collection is `[]`.
3. Arrays are ordered: `roadmap.next` by position, `roadmap.later` by
   milestone order from `STRATEGY.md` with `Unassigned` last and then by
   position, `inbox` by file name, `briefs` by path, and `log.done`,
   `log.dropped`, `log.reviews`, and `board.activity` newest first.
4. Values are copied, not summarised: no prose, no percentages, no
   judgements. Totals live in `counts` only.
5. Only `generatedAt`, `source.branch`, and `source.head` may differ between
   two runs over unchanged PM state. Everything else is a bug.
6. UTF-8, LF line endings, two-space indent, one trailing newline. `$schema`
   is the first key, with the value `"./planning.schema.json"`.
7. `position` is 1-based inside its roadmap section. `schemaVersion`, the
   versions, and the counts are integers.

## Field map

Top-level keys, in order:

| Key | Read from | Contents |
| --- | --- | --- |
| `$schema` | constant | `"./planning.schema.json"` |
| `schemaVersion` | constant | `2`; bump it with the schema when the shape changes, together with `pm-docs-site`'s templates |
| `generatedAt` | clock | local ISO 8601 with offset: bash `date +%Y-%m-%dT%H:%M:%S%:z`, PowerShell `Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"` |
| `generator` | this skill | `skill: "pm-export"`, `skillsVersion` from the marker in `pm-setup`'s reference, `rulesVersion` from `config.md` |
| `project` | `config.md` | `pmRoot`, `defaultBranch`, `branchPattern` |
| `source` | git | `branch` (`git branch --show-current`, `null` when detached), `head` (`git rev-parse HEAD`) |
| `vision` | `VISION.md` | `problem`, `customer`, `outcomes[]` as `{id: "V1", text}`, `outOfScope[]`, `constraints{timeAvailable, budget, stack}` |
| `strategy` | `STRATEGY.md` | `focus{milestone, whyNow}` and the five lists below |
| `now` | `NOW.md` | `status`, `item{id, title}`, `stage`, `session`, `brief`, `milestone`, `spec`, `plan`, `started`, `doneWhen[]`, `checkpoint` |
| `plan` | the plan at `now.plan` | `path`, `checked`, `total`, `tasks[]` as `{number, title, checked, total, steps[]}`, each step `{text, checked}`: one task per `### Task N` heading, one step per `- [ ]`/`- [x]` line with its text copied. `null` when `NOW.md` has no plan |
| `roadmap` | `ROADMAP.md` | `next[]` and `later[]`, each an item object |
| `board` | derived | `columns{now, next, foryou, waiting, done}` and `activity[]` |
| `log` | `LOG.md` | `done[]`, `dropped[]`, `reviews[]` |
| `inbox` | `inbox/*.md` | One entry per file, `README.md` excluded |
| `briefs` | `briefs/*.md` | One entry per file, `README.md` excluded |
| `counts` | derived | `next`, `later`, `nextMax`, `openInbox`, `discuss`, `shapingBriefs`, `done`, `dropped`, `blockers` |
| `checks` | derived | `reviewDue`, `lastReview`, `claimable[]`, `drift` |

An **item object** has these keys, in this order:

- `id` and `title`, from the `### R-NNN <Title>` heading.
- `section` (`next` or `later`), and `position` inside that section.
- `label`: `next`, `later`, `blocked` when `Status` is blocked, or `waiting`
  when a `Depends on` ID is not in `log.done`. The same labels as
  `pm-roadmap`.
- `serves` from the comma-separated `Serves` values, `milestone` (`null`
  when unset), `owner` (`agent` when missing), `doneWhen`, `size` as `S`,
  `M`, or `L`, and `dependsOn` (`[]` for none).
- `status` as `{value: "ready" | "paused" | "blocked", reason, since}`,
  splitting `blocked (<reason>, since <date>)`.
- `brief`, `note`, and `revisits` as the paths and text written, or `null`.
- `claimable`, from the **Claimable** definition.

`now.checkpoint` is `{at, stoppedAt, nextAction, startWith, decisions,
context, openQuestion}` or `null`. `now.doneWhen` is the list under
`## Done when`.

The `board` mirrors `pm-board`:

- `columns.now` holds the active item as `{id, title, owner, size, detail}`,
  with `detail` = `<stage>, <done>/<total> plan steps`.
- `columns.next` holds `Owner: agent` or `both` items in Next, including
  `paused`; `columns.foryou` holds `Owner: user` items in Next;
  `columns.waiting` holds blocked and dependency-blocked items with the
  reason as `detail`; `columns.done` holds the `## Done` lines inside the
  board window in `config.md`.
- `activity` is the union of `## Done`, `## Dropped`, and `## Reviews`,
  newest first, as `{date, kind: "done" | "dropped" | "review", id, title,
  milestone, owner, result}`, with `null` where the line has no such field.

Remaining objects:

- `strategy.milestones[]` is `{id, name, serves[], exitCriteria, target,
  status}`; `bets[]` is `{id, statement, evidence, signal, status}`;
  `assumptions[]` is `{id, statement, test, status}`; `notDoing[]` is
  `{thing, why, revisit}`; `decisions[]` is `{date, decision, why,
  rejected}`. `status`, `target`, and `decision` keep the words in the file,
  including any date.
- `log.done[]` is `{date, id, title, milestone, owner, plan, result}`;
  `log.dropped[]` is `{date, id, title, reason}`; `log.reviews[]` is `{date,
  summary}`.
- `inbox[]` is `{file, title, captured, source, kind, severity, affects,
  context, discuss, related[], brief, reviewed, idea}`. Missing fields are
  `null`, `related` is `[]` for `none`, and `idea` is the verbatim text
  under `## Idea`.
- `briefs[]` is `{path, id, title, status, origin, updated, decision,
  problem, doneWhen, revisions[]}`, where `problem` and `doneWhen` are the
  text under `## Problem` and `## Done when` (first line of each), and
  `revisions` holds `{date, text}` read from `## Revisions`.
- `checks.drift` follows the **Drift** definition and `checks.reviewDue`
  follows **Review due**.

## Steps (write)

1. Read every PM file: `config.md`, `VISION.md`, `STRATEGY.md`, `NOW.md`,
   `ROADMAP.md`, `LOG.md`, `inbox/`, and `briefs/`. A missing optional file
   is empty (Shared definitions: Optional files).
2. Build the document in the field-map order, applying the format rules.
   Where a value is not written in the file, use `null`, never a guess; state
   any `Assumption:` in the `Note` of the output.
3. Copy `references/planning.schema.json` to `<PM root>/planning.schema.json`
   when that file is missing or differs.
4. Write `<PM root>/planning.json`.
5. **Verify before reporting.**
   - Parse the file and confirm it is valid JSON.
   - Confirm the top-level keys equal the schema's `required` list, in order.
   - Confirm `schemaVersion` equals the schema's const.
   - Confirm `now.item` and the `roadmap.next` IDs match the Markdown.
   - Confirm `counts` recompute from the files.

   Fix the document, never the schema. If a check still fails, show the first
   failure and stop without committing.
6. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): export <YYYY-MM-DD>`.
7. Show the output.

## Steps (check)

1. Read `<PM root>/planning.json` and `<PM root>/planning.schema.json`. If
   either is missing, reply `No export at <path>. Run pm-export.` Stop. Write
   nothing.
2. **Validate** both files: they parse; every `required` key is present at
   the top level; no key outside the schema is present; `schemaVersion`
   equals the schema const; `section`, `owner`, `size`, `status.value`, and
   `label` hold values the schema allows.
3. **Compare** with the Markdown and git: `now.item`, `now.status`, the
   `roadmap.next` and `roadmap.later` ID order, `counts`, `checks`, and
   `source.head` against `git rev-parse HEAD`.
4. Report the first difference in one line, for example `roadmap.next[2] is
   R-012 in ROADMAP.md and R-009 in the export.`, or `current`.
5. If the export is stale and no workflow is active, ask one choice question
   `Regenerate the export?` with `Regenerate it (recommended)` (run `write`)
   and `Leave it`. During a workflow, report and resume the step in progress.

## Output

```markdown
## Export <YYYY-MM-DD>

- File: <PM root>/planning.json (<n> KB | <n> items, <n> inbox, <n> briefs)
- Schema: <PM root>/planning.schema.json (<n | refreshed | unchanged>)
- Checked: <keys and counts match | first difference>
- PM state: <commit result>

## Do this next

1. <one action>
   - Start with: <skill name, command, or path>
   - Done when: <observable check>

## Note

- <assumptions, differences resolved, the schema version if it moved>
```
