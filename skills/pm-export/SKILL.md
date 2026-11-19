---
name: pm-export
description: Use when the user asks for the plan, roadmap, board, or project status as JSON, asks to export or update the current status, or a tool, script, or dashboard needs the plan in a machine-readable form. Writes planning.json and its schema inside the PM root in one fixed, schema-validated format with its bundled script, checks them against the schema and the Markdown without writing, or answers a query for one value or ID.
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
| `query <path or ID>` | "what does the export say about R-012?", a script or tool needs one value | Read-only: print one value, the entries for one ID, or a summary |

A PM commit also runs write steps 1 to 5, without the commit or the
output, when `Export on commit` in `config.md` asks for it (rules:
Committing PM state, step 6). That refresh is part of the skill that
commits, so it may run during a workflow and in the worktree that holds a
Completion record.

## Script

`scripts/export.ts` in this skill's folder is the exporter: it reads the PM
files, builds the document exactly as the field map below says, and
validates it against `references/planning.schema.json` with its own
validator (no package, no network). Every project gets the same export
from the same Markdown, so never build or patch `planning.json` by hand
when Bun is available. It needs Bun (`bun --version`).

| Command | Effect |
| --- | --- |
| `bun <skill>/scripts/export.ts write [--root <worktree>]` | Build, validate, and write `planning.json`, and copy the schema when it differs. Prints `wrote:`, `schema:`, and one `assumption:` line per fact it could not read. Writes nothing and exits 1 with `invalid:` lines when the document would not match the schema |
| `bun <skill>/scripts/export.ts write --dry-run` | Print the document instead of writing it |
| `bun <skill>/scripts/export.ts check [--root <worktree>]` | Read-only. Validate the export and its schema copy, rebuild from the Markdown as of the export's `generatedAt` and branch, and print `current` or the first difference; exit 1 on a difference |
| `bun <skill>/scripts/export.ts validate [<file>] [--schema <file>]` | Read-only. Validate one file (default: the export) and print `valid:` or one `invalid: <path>: <reason>` line per error |
| `bun <skill>/scripts/export.ts get [<path>] [--fresh]` | Read-only. Print the value at a path (`counts`, `roadmap.next[0].title`, `checks.claimable`) |
| `bun <skill>/scripts/export.ts find <ID> [--fresh]` | Read-only. Print every entry with that ID (`R-012`, `M2`, `RK-003`, `B1`, `A1`, `V1`) and its path |
| `bun <skill>/scripts/export.ts summary [--fresh]` | Read-only. Print the export time, Now, focus, counts, claimable items, Review due, and drift |

`--root` is the repository or worktree root (default: the current
directory); `--pm-root` overrides the PM root it reads from the agent
instructions file. `get`, `find`, and `summary` read `planning.json`, the
way a tool would; `--fresh` builds from the Markdown in memory instead and
writes nothing, which is the form an agent uses when it needs current
values. The script never commits, never reads `STACK.md` or `PAUSE.md`,
and writes only the two export files.

The script and the field map change together: a change to the format is a
change to the schema, `references/planning.example.json`,
`scripts/planning.ts`, and its test (`bun test skills/pm-export` in the
pm-skills repository).

## Guard

- If `<PM root>/config.md` is missing: `No <PM root> state. Run pm-init.`
  Stop.
- Write in the main worktree, never in a feature worktree, except the
  refresh for a Completion record, which writes in the commit worktree.
- The **Export file** is derived (Shared definitions): never hand-edit it,
  never read it as PM state, and never resolve a disagreement in its favour.
  When the JSON and the Markdown differ, the Markdown is correct and the
  export is stale.
- During an active workflow only `check` may run (Non-interruption rule 3).
  `write` applies Non-interruption rule 4.
- Export only what the PM files hold. Never add environment values, tokens,
  source-code excerpts, or anything not in the PM root. Never export
  `STACK.md` or `PAUSE.md`: they are session memory, not plan.
- Never edit any other PM file. This skill reads them all and writes two.
- Anyone can validate the result with
  `bun <skill>/scripts/export.ts validate`, which needs no package and
  checks the `date-time` format. The schema is plain JSON Schema draft
  2020-12, so any validator for that draft also reads it.
- During a workflow, `query` and `check` may run (Non-interruption rule 3:
  read-only). `query` without `--fresh` reads the export, which may be
  stale; an agent deciding PM matters uses `--fresh` or the Markdown.

## Format rules (identical on every run)

1. Key order is the order in the field map below, which matches
   `references/planning.schema.json`. Never sort, never add a key.
2. Every key is present. Empty is `null`; an empty collection is `[]`.
3. Arrays are ordered: `roadmap.next` by position, `roadmap.later` by
   milestone order from `STRATEGY.md` with `Unassigned` last and then by
   position, `inbox` by file name, `briefs` by path, `risks.open` in
   register order (red, amber, green, then ID), and `log.done`,
   `log.dropped`, `log.reviews`, `board.activity`, `risks.closed`, and
   `risks.removed` newest first.
4. Values are copied, not summarised: no prose, no percentages, no
   judgements. Totals live in `counts` only.
5. Only `generatedAt`, `source.branch`, and `source.head` may differ between
   two runs over unchanged PM state. Everything else is a bug.
6. UTF-8, LF line endings, two-space indent, one trailing newline. `$schema`
   is the first key, with the value `"./planning.schema.json"`.
7. `position` is 1-based inside its roadmap section, the order of the
   item's block in `ROADMAP.md`. `schemaVersion`, the versions, and the
   counts are integers.
8. Text inside HTML comments is never read: the templates keep their
   examples there. A template placeholder (`[M1]`, `<path>`) or an empty
   value is `null`, and so is `none` in an optional field (`Milestone`,
   `Brief`, `Note`, `Target`, a risk's `Affects`, `Trigger`, `Mitigation`,
   `RAG override`, an inbox file's `Affects`, `Context`, `Brief`). A
   multi-line field joins its lines with one space.
9. In a `LOG.md` line, a full stop and a space separate the fields, so a
   field's final `.` is dropped (`Result: PR #41.` is `"PR #41"`). Strategy lines keep their
   words, including the final `.`, except `notDoing[].thing`.

## Field map

Top-level keys, in order:

| Key | Read from | Contents |
| --- | --- | --- |
| `$schema` | constant | `"./planning.schema.json"` |
| `schemaVersion` | constant | `4`; bump it with the schema when the shape changes, together with `pm-docs-site`'s templates |
| `generatedAt` | clock | local ISO 8601 with offset: bash `date +%Y-%m-%dT%H:%M:%S%:z`, PowerShell `Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"` |
| `generator` | this skill | `skill: "pm-export"`, `skillsVersion` from the marker in `pm-setup`'s reference, `rulesVersion` from `config.md` |
| `project` | `config.md` | `pmRoot`, `defaultBranch`, `branchPattern` |
| `source` | git | `branch` (`git branch --show-current`, `null` when detached), `head` (`git rev-parse HEAD`) |
| `vision` | `VISION.md` | `problem`, `customer`, `outcomes[]` as `{id: "V1", text}`, `outOfScope[]`, `constraints{timeAvailable, budget, stack}` |
| `strategy` | `STRATEGY.md` | `focus{milestone, whyNow}` and the five lists below |
| `now` | `NOW.md` | `status`, `item{id, title, serves, owner, size, dependsOn, revisits}`, `stage`, `session`, `brief`, `milestone`, `spec`, `plan`, `started`, `doneWhen[]`, `checkpoint` |
| `plan` | the plan at `now.plan` | `path`, `checked`, `total`, `tasks[]` as `{number, title, checked, total, steps[]}`, each step `{text, checked}`: one task per `### Task N` heading, one step per `- [ ]`/`- [x]` line with its text copied. `null` when `NOW.md` has no plan |
| `roadmap` | `ROADMAP.md` | `next[]` and `later[]`, each an item object |
| `board` | derived | `columns{now, next, foryou, waiting, done}` and `activity[]` |
| `log` | `LOG.md` | `done[]`, `dropped[]`, `reviews[]` |
| `inbox` | `inbox/*.md` | One entry per file, `README.md` excluded |
| `briefs` | `briefs/*.md` | One entry per file, `README.md` excluded |
| `risks` | `RISKS.md` | `open[]` and `closed[]`, each a risk object, and `removed[]` |
| `counts` | derived | `next`, `later`, `nextMax`, `openInbox`, `discuss`, `shapingBriefs`, `done`, `dropped`, `blockers`, `openRisks`, `redRisks`, `amberRisks`, `greenRisks` |
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
  with `detail` = `<stage>, <done>/<total> plan steps` (`<stage>` alone
  without a plan). `owner` and `size` come from `now.item`.
- `columns.next` holds `Owner: agent` or `both` items in Next, including
  `paused`, with the `Status` value as `detail`; `columns.foryou` holds
  `Owner: user` items in Next, with `blocks <ID> <title>` as `detail` when
  another item depends on it; `columns.waiting` holds the Next items
  labelled `blocked` (`blocked: <reason>, since <date>`) or `waiting`
  (`needs <ID> <title>`); `columns.done` holds the `## Done` lines dated
  within the board window in `config.md`, counted back from the export
  date.
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
- A **risk object** is `{id, title, likelihood, impact, rag, ragOverride,
  status, owner, affects, trigger, mitigation, raised, reviewed, closed}`,
  read from one `### RK-NNN <Title>` block (Shared definitions: Risk
  register). `rag` is the `RAG` value written, never recomputed here;
  `ragOverride`, `affects`, `trigger`, and `mitigation` are `null` for
  `none`; `closed` is the `Closed` text, `null` while the risk is open.
  `risks.removed[]` is `{date, id, title, reason}`. `counts.openRisks` is
  `risks.open` and the RAG counts split it by `rag`.
- `counts.blockers` is the items in Next and Later whose `Status` is
  `blocked`; `counts.openInbox` follows **Open inbox count**;
  `counts.shapingBriefs` is the briefs whose `Status` starts `shaping`.
- `plan` reads the plan file from the checkout the script runs in. A plan
  that is not there (the item's branch is checked out elsewhere) is
  `null`, with an `assumption:` line.
- `checks.drift` follows the **Drift** definition and `checks.reviewDue`
  follows **Review due**.

## Steps (write)

1. **Run the script** in the commit worktree (the main worktree, or the
   one that holds a Completion record):
   `bun <skill>/scripts/export.ts write --root "<worktree>"`. It reads
   `config.md`, `VISION.md`, `STRATEGY.md`, `NOW.md`, `ROADMAP.md`,
   `LOG.md`, `RISKS.md`, `inbox/`, `briefs/`, and the plan that `NOW.md`
   names (never `STACK.md` or `PAUSE.md`), treats a missing optional file
   as empty (Shared definitions: Optional files), and builds the document
   in the field-map order with the format rules.
2. **Read its result.** It validates the document against the schema
   before it writes. On exit 1 it has written nothing: show the first
   `invalid:` line and stop without committing. The fix is in the Markdown
   (an item with `Size: XL` is fixed with `pm-item edit`), never in the
   export or the schema.
3. It copies `references/planning.schema.json` to
   `<PM root>/planning.schema.json` when that file is missing or differs,
   and prints `schema: <written | refreshed | unchanged>`.
4. It writes `<PM root>/planning.json` and prints `wrote:` with the counts.
   Each `assumption:` line is a fact it could not read; copy it to the
   output `Note` as `Assumption: ...`.
5. **Verify** with `bun <skill>/scripts/export.ts check --root "<worktree>"`:
   it prints `current`.

   **Without Bun** (`bun --version` fails): build the document by hand
   from the field map and the format rules, where a value not written in
   the file is `null`, never a guess, then confirm it parses, its top-level
   keys equal the schema's `required` list in order, `schemaVersion` equals
   the schema's const, and `counts` recompute from the files. Add
   `Validated by hand: Bun is not installed.` to the `Note`.
6. **Commit** the PM state (rules: Committing PM state), with the message
   `docs(pm): export <YYYY-MM-DD>`.
7. Show the output.

## Steps (check)

1. **Run** `bun <skill>/scripts/export.ts check`. It writes nothing. A
   missing export or schema prints `No export at <path>. Run pm-export.`;
   stop.
2. It **validates** both files: the schema copy equals this skill's
   reference, and the export matches the schema (every key, type, enum,
   ID pattern, and `date-time`), printing one `invalid:` line per error.
3. It **compares** the export with a fresh build from the Markdown, as of
   the export's own `generatedAt` and `source.branch`, so the board window,
   **Review due**, and drift compare like for like. Only `generatedAt` and
   `source` are ignored (format rule 5).
4. Report its first line: `current`, or the first difference, for example
   `roadmap.next[0].title is Invoice emails from the Markdown and Invoice
   email in planning/planning.json.` A `note:` that `source.head` is older
   than `HEAD` is expected: the PM commit that carried the export comes
   after it. Without Bun, compare `now.item`, the `roadmap.next` and
   `roadmap.later` ID order, `risks.open`, `counts`, and `checks` by hand.
5. If the export is stale and no workflow is active, ask one choice question
   `Regenerate the export?` with `Regenerate it (recommended)` (run `write`)
   and `Leave it`. During a workflow, report and resume the step in progress.

## Steps (query)

1. Pick the command from the request: one value is `get <path>`, one ID is
   `find <ID>`, a status line is `summary`. Add `--fresh` when the answer
   must reflect the Markdown now rather than the last export.
2. Run it and print its output in a fenced `json` or `text` block. It
   writes nothing, so there is no commit.
3. If it prints `No export at <path>.`, recommend `pm-export` (`write`), or
   rerun with `--fresh`.

## Output (write, check)

```markdown
## Export <YYYY-MM-DD>

- File: <PM root>/planning.json (<n> items, <n> inbox, <n> briefs, <n> risks)
- Schema: <PM root>/planning.schema.json (<written | refreshed | unchanged>)
- Checked: <current | first difference | validated by hand>
- PM state: <commit result>

## Do this next

1. <one action>
   - Start with: <skill name, command, or path>
   - Done when: <observable check>

## Note

- <assumptions, differences resolved, the schema version if it moved>
```
