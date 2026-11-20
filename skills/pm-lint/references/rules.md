# PM file format rules

The format every file in the PM root follows, whichever `pm-*` skill or
person writes it. `pm-lint` checks these rules and fixes the ones marked
`Fix: yes`; `scripts/lint.ts` in this skill's folder implements them, and
its tests keep this list and the code in step. A skill that writes a PM
file writes it to these rules, and a PM commit runs `pm-lint` before it
commits (rules: Committing PM state).

The file formats themselves are defined in the pm-skills section of the
agent instructions (Shared definitions) and the `pm-init` templates. These
rules restate them as checks; they never add a field or a state.

## Scope

| Path in the PM root | Format | Rules |
| --- | --- | --- |
| `config.md` | The `pm-init` template | format, fields, config |
| `VISION.md` | The `pm-init` template | format, fields, vision |
| `STRATEGY.md` | The `pm-init` template | format, fields, strategy |
| `NOW.md` | The `pm-init` template, and the checkpoint `pm-checkpoint` writes | format, fields, now |
| `ROADMAP.md` | **Item fields** (Shared definitions) | format, fields, roadmap |
| `LOG.md` | The `pm-init` template's line formats | format, log |
| `RISKS.md` | **Risk register** (Shared definitions) | format, fields, risks |
| `STACK.md` | **Stack file** (Shared definitions) | format, fields, stack |
| `PAUSE.md` | **Pause file** (Shared definitions) | format, fields, pause |
| `inbox/*.md` | **Inbox file** (Shared definitions) | format, fields, inbox |
| `briefs/*.md` | **Brief** (Shared definitions) | format, fields, brief |
| `research/*.md`, every `README.md`, any other Markdown | Free text | format |
| `planning.json` | **Export file**, against `planning.schema.json` | export |

- **HTML comments are never checked** beyond whitespace: the templates keep
  their examples there (`<!-- - 2026-10-29 R-007 ... -->`).
- **Placeholders are not values.** A value that is only a template
  placeholder (`[M1]`, `[outcome]`, `<path>`) or empty is skipped by the
  value and reference rules, so a fresh `pm-init` install passes.
- **References need their target file.** `Serves` is checked against
  `VISION.md` only when it has V lines, and `Milestone` against
  `STRATEGY.md` when it exists.
- **The export rules need pm-export** installed beside `pm-lint` (the
  `skills` CLI installs them side by side). Without it they are skipped.
  `export/build` runs only when every other structure rule passes.

## Severity and fixing

- An `error` fails `pm-lint check` (exit 1), and therefore a pre-commit
  hook. A `warning` is reported and fails only with `--strict`.
- `pm-lint fix` applies every rule marked `Fix: yes` and nothing else. A
  fix changes layout, never meaning: whitespace, blank lines, the bullet
  marker, a field key's case, the order the rules define, and a RAG the
  rules derive. It never changes a value, adds a field, moves an item
  between sections, or deletes a line. Everything else is reported for the
  skill that owns the file (for example `pm-item edit` for an item's
  `Size`, `pm-risk` for a risk).
- Line endings: files are read with LF or CRLF and keep the ending they
  had when fixed, so a checkout with `core.autocrlf` stays clean.

## Rules

### format

Every Markdown file in the PM root. A dependency-free subset of the
`markdownlint` defaults the templates already follow, so a repository that
also runs `markdownlint` agrees with it. Code fences are never reformatted.

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `format/final-newline` | error | yes | The file ends with exactly one newline. |
| `format/trailing-space` | error | yes | No line ends with spaces or tabs. |
| `format/tabs` | error | yes | No hard tabs outside code fences (a tab becomes four spaces). |
| `format/blank-lines` | error | yes | No two blank lines in a row outside code fences. |
| `format/heading-space` | error | yes | An ATX heading has one space after its `#`s and no closing `#`s. |
| `format/heading-blank` | error | yes | A heading has a blank line before and after it. |
| `format/list-marker` | error | yes | Bullets use `-`. |
| `format/list-blank` | error | yes | A list has a blank line before and after it. |
| `format/fence-blank` | error | yes | A code fence has a blank line before and after it. |
| `format/first-heading` | error | no | The first line (after any HTML comment) is a level-1 heading. |
| `format/single-h1` | error | no | There is one level-1 heading. |
| `format/heading-increment` | error | no | Heading levels go down one at a time. |
| `format/unclosed` | error | no | Every code fence and HTML comment is closed. |

### fields

Every `- Key: value` list a file format defines: the top of `NOW.md`, a
checkpoint, a roadmap item, a milestone, a risk, an inbox file, a brief's
header, a stack entry, the pause file, and the `config.md` sections.

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `fields/key-case` | error | yes | A known field key is written as defined (`Done when`, not `done when`). |
| `fields/duplicate` | error | no | A field appears once in its block. |
| `fields/unknown` | warning | no | A field key is one the file format defines. |

### config

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `config/sections` | error | no | `config.md` has `## Install` and `## Limits`. |
| `config/optional-sections` | warning | no | `config.md` has `## Handoffs`, `## Commits`, and `## Last review` (older installs use defaults; `pm-setup` adds them). |
| `config/rules-version` | error | no | `Rules version` is a whole number. |
| `config/limits` | error | no | Each limit starts with a number, and `Branch name pattern` is a backticked pattern with `<id>`. |
| `config/commits` | error | no | `PM state commit` is always, ask, or never; `Export on commit` is always, if present, or never; `PM branch` is set. |
| `config/last-review` | error | no | `Last review` `Date` is never or YYYY-MM-DD. |

### vision

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `vision/sections` | error | no | `VISION.md` has Problem, Customer, a `done when` section, Out of scope, and Constraints. |
| `vision/outcome` | error | no | Each outcome is `V<n>: <text>`, and each V number is used once. |
| `vision/constraints` | warning | no | Constraints has Time available, Budget, and Stack. |

### strategy

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `strategy/sections` | error | no | `STRATEGY.md` has Current focus, Milestones, Bets, Assumptions and risks, Not doing, and Decisions, in that order. |
| `strategy/focus` | error | no | Current focus has `Milestone` and `Why now`, and the milestone is one in `## Milestones` (`M2` or `M2 <Name>`). |
| `strategy/milestone` | error | no | A milestone is `### M<n> <Name>` with Serves, Exit criteria, Target, and Status; its ID is used once. |
| `strategy/milestone-status` | error | no | A milestone's Status is active, planned, or `done (YYYY-MM-DD)`; Target is none or YYYY-MM-DD. |
| `strategy/serves` | error | no | Every `Serves` V line exists in `VISION.md`. |
| `strategy/bet` | error | no | A bet is `B<n>: <statement>` with Evidence, We will know when, and Status (open, won, or lost). |
| `strategy/assumption` | error | no | An assumption is `A<n>: <statement>` with Test and Status (untested, holds, or broken). |
| `strategy/not-doing` | warning | no | A Not doing line has `Why:` and `Revisit:`. |
| `strategy/decision` | error | no | A decision is `<YYYY-MM-DD> <decision>. Why: <reason>. Rejected: <alternatives>.` |
| `strategy/decision-order` | error | yes | Decisions are newest first. |

### now

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `now/fields` | error | no | `NOW.md` lists Status, Item, Session, Stage, Brief, Milestone, Spec, Plan, and Started, in that order, optionally with Serves, Owner, Size, Depends on, and Revisits after Milestone, and then an optional Note. |
| `now/sections` | error | no | `NOW.md` has `## Done when` then `## Checkpoint`. |
| `now/status` | error | no | Status is idle or active. |
| `now/idle` | error | no | When idle, every field except Status is empty, and so are Done when and the checkpoint. |
| `now/active` | error | no | When active: Item is `R-NNN <Title>`, Session is set, Stage is design, plan, execute, or finish, Started is YYYY-MM-DD, and Done when has a check. |
| `now/checkpoint` | error | no | A filled checkpoint is `## Checkpoint YYYY-MM-DD HH:MM` with Stopped at, Next action, Start with, Decisions, and Context (Open question is optional). |
| `now/not-in-roadmap` | error | no | The active item is not also in `ROADMAP.md`. |
| `now/item` | error | no | When active, Serves lists V IDs from `VISION.md`, Owner is agent, user, or both, Size is S, M, or L, Depends on lists existing IDs or none, and Revisits is one existing ID or empty. |

### roadmap

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `roadmap/sections` | error | no | `ROADMAP.md` has `## Next` then `## Later`, and no other level-2 section. |
| `roadmap/item` | error | no | An item is `### R-NNN <Title>` (at least 3 digits) with Serves, Done when, Size, and Status. |
| `roadmap/owner` | error | no | Owner is agent, user, or both. |
| `roadmap/size` | error | no | Size is S, M, or L. |
| `roadmap/status` | error | no | Status is ready, paused, or `blocked (<reason>, since YYYY-MM-DD)`. |
| `roadmap/next-max` | error | no | Next holds at most the `Max items in Next` in `config.md`. |
| `roadmap/id-unique` | error | no | An item ID appears once across `ROADMAP.md`, `NOW.md`, and the `LOG.md` Done and Dropped lines: IDs are never reused. |
| `roadmap/depends` | error | no | Every `Depends on` ID exists in `ROADMAP.md`, `NOW.md`, or `LOG.md`, is not the item itself, and forms no cycle. |
| `roadmap/serves` | error | no | Every `Serves` V line exists in `VISION.md`. |
| `roadmap/milestone` | error | no | `Milestone` names a milestone in `STRATEGY.md`, or is none. |
| `roadmap/revisits` | error | no | `Revisits` names an item in the `LOG.md` Done lines. |
| `roadmap/later-order` | warning | no | Later is grouped by milestone in `STRATEGY.md` order, unassigned last (moving items is `pm-roadmap`'s edit, not a fix). |

### log

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `log/sections` | error | no | `LOG.md` has `## Done`, `## Dropped`, and `## Reviews`, in that order. |
| `log/line` | error | no | Each line starts with YYYY-MM-DD; a Done line is `<date> R-NNN <Title>. Milestone: <M or none>. Owner: <owner>. Plan: <path or none>. Result: <evidence>.`; a Dropped line has `Reason:`. |
| `log/order` | error | yes | Each section is newest first (a stable sort by date). |
| `log/id-unique` | error | no | An ID has at most one Done line. |

### risks

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `risks/sections` | error | no | `RISKS.md` has `## Open`, `## Closed`, and `## Removed`, in that order. |
| `risks/risk` | error | no | A risk is `### RK-NNN <Title>` with every register field, in the register's order; Closed only on a closed risk. |
| `risks/values` | error | no | Likelihood and Impact are low, medium, or high; RAG is red, amber, or green; Owner is agent, user, or both; Raised starts with a date; Reviewed is never or a date. |
| `risks/rag` | error | yes | RAG is the value Likelihood × Impact derives (**RAG**, Shared definitions), unless RAG override gives a reason. |
| `risks/section-status` | error | no | An open risk is open, mitigating, or accepted with no Closed; a closed risk is closed with `Closed: YYYY-MM-DD: <reason>`. |
| `risks/order` | error | yes | Open is ordered red, amber, green, then by ID. |
| `risks/id-unique` | error | no | A risk ID appears once across Open, Closed, and Removed. |
| `risks/removed` | error | no | A removed risk is `- YYYY-MM-DD RK-NNN <title>. Reason: <reason>.` |

### inbox

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `inbox/filename` | error | no | An inbox file is named `YYYY-MM-DD-HHMM-<slug>.md`, the slug in lower-case kebab case. |
| `inbox/fields` | error | no | Captured is `YYYY-MM-DD HH:MM`; Source is user or `agent (<skill or item and stage>)`; Kind is feature, bug, improvement, question, inspiration, or tech-debt; Discuss is yes or no; Reviewed is never or a date; a bug has a Severity of blocker, major, minor, or cosmetic. |
| `inbox/idea` | error | no | `## Idea` holds the idea. |
| `inbox/bug` | warning | no | A bug has a `## Reproduction` section; only a bug has a Severity. |
| `inbox/sections` | warning | no | An inbox file uses only the Idea, Reproduction, Links, and Notes sections. |

### brief

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `brief/filename` | error | no | A brief is named `R-NNN-<slug>.md` or `YYYY-MM-DD-<slug>.md`. |
| `brief/header` | error | no | A brief has Status (shaping, parked, `on roadmap (<IDs>)`, done, or dropped), Origin, and Updated (YYYY-MM-DD). |
| `brief/sections` | error | no | A brief has Problem, Who and evidence, Original idea, Proposal, Alternatives considered, Challenges and answers, Ramifications, Done when, Size and slicing, Open questions, and Decision, in that order, then optionally Revisions. |

### stack

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `stack/entry` | error | no | A stack entry is `### R-NNN <Title>` with Pushed, Branch, Stage, Reason, Done when, and Checkpoint. |

### pause

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `pause/fields` | error | no | `PAUSE.md` has Paused (`YYYY-MM-DD HH:MM`), Session, Item, Running, and Files, then `## Resume with` (Next action, Start with, Open question) and `## Context`. |

### title

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `title/length` | warning | no | An inbox file's or a risk's title is at most 8 words. |

### export

| Rule | Severity | Fix | Requirement |
| --- | --- | --- | --- |
| `export/build` | error | no | The PM files build into an export that matches `pm-export`'s schema (`pm-export`'s own builder and validator). |
| `export/file` | error | no | `planning.json`, when it is checked, matches `planning.schema.json`. |

## Git hooks

`bun <skill>/scripts/lint.ts check --staged` lints the staged version of
each staged PM file (read from the index, so a fix left unstaged does not
hide an error), with the rest of the PM root as context for the
cross-file rules. It exits 0 when no PM file is staged, so it costs
nothing on a commit that touches only code. `bun <skill>/scripts/lint.ts
hook <lefthook | husky | git>` prints the configuration for each; the
lefthook form is:

```yaml
pre-commit:
  jobs:
    - name: pm-lint
      run: bun .agents/skills/pm-lint/scripts/lint.ts check --staged
```

Use the path the skills are installed at in the repository
(`.agents/skills/` or `.claude/skills/`). A fixing hook runs `fix --staged`
first and sets lefthook's `stage_fixed: true`; `fix --staged` rewrites the
working-tree files of the staged paths, so stage them whole.
