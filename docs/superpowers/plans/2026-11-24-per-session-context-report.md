# R-043 Per-session context report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only `pm-help` script that estimates, per session type, the context an agent session loads, and record this repository's baseline.

**Architecture:** A JSON session map (`skills/pm-help/references/sessions.json`) names each session's skills and PM files. `map.ts` loads and checks it, `sources.ts` finds and measures text (agent-file sections, skills, followed references), and `context.ts` builds the report and is the CLI. `pm-help` diagnose prints the table.

**Tech Stack:** TypeScript on Bun, `node:` and `bun:` builtins only, `bun:test`.

**Spec:** `docs/superpowers/specs/2026-11-24-per-session-context-report-design.md`

## Global Constraints

- Imports only `node:` and `bun:` builtins (no packages).
- Estimated tokens are `Math.ceil(chars / 4)` on text with `\r\n` normalised to `\n` (ADR-008).
- Read-only: never writes a file, never runs git.
- Exit 0 on any report (missing skills or files included); exit 2 on a usage error or an invalid `sessions.json`.
- Session ids, exactly: `always`, `resume`, `claim`, `checkpoint`, `review`.
- Tidy limits in characters: `LOG.md` 32000, `ROADMAP.md` 32000, any brief 24000; an entry at the limit, none one character below.
- Skills are installed separately: `pm-help`'s scripts copy, never import, `pm-lint`'s PM-root detection.
- Version: `just bump prerelease` (21.0.0-pre.6 to 21.0.0-pre.7); the managed section and its marker do not change.

## Review Focus

- `AGENTS.md` and `CLAUDE.md` both present, and `CLAUDE.md` holding only `@AGENTS.md`: counted as written, never double-counting a missing file; expect both counted when both have content (Task 2 test).
- A reference citation cycle (`a.md` cites `b.md`, `b.md` cites `a.md`): terminates, each counted once (Task 2 test).
- A repository with no PM root, or a PM root with no `decisions/`, `inbox/`, or `briefs/`: report prints with 0s, exit 0 (Task 3 test).
- An agent file with no managed markers: `always` contributors are its `##` sections only (Task 2 test).
- `--pm-root` given without a trailing slash, or with backslashes: normalised (Task 4 test).

---

### Task 1: Session map and its check

**Files:**
- Create: `skills/pm-help/references/sessions.json`
- Create: `skills/pm-help/scripts/map.ts`
- Create: `skills/pm-help/scripts/context.test.ts`
- Modify: `justfile` (`test` recipe), `.github/workflows/ci.yml` (the `bun test scripts/ ...` line): add `skills/pm-help/`

**Interfaces:**
- Produces:

```ts
export type SessionId = "always" | "resume" | "claim" | "checkpoint" | "review";
export interface SessionSpec { id: SessionId; agentFile?: true; skills?: string[]; handoff?: string; pmFiles?: string[]; partial?: string[]; brief?: true; decisions?: true; inbox?: true }
export interface SessionMap { version: 1; sessions: SessionSpec[]; tidy: { "LOG.md": number; "ROADMAP.md": number; brief: number } }
export class MapError extends Error {}
export function parseMap(json: unknown): SessionMap;      // throws MapError with the first problem
export function loadMap(path?: string): SessionMap;       // default: ../references/sessions.json beside the script
```

- [ ] **Step 1: Write `sessions.json`** with the shape in the spec's "The map" section. Confirm each file list against the skill's own read step (`pm-resume` step 1, `pm-next` steps 1 and 10, `pm-checkpoint` step 5, `pm-review` step 1) and adjust the lists, not the shape.

- [ ] **Step 2: Write the failing tests** in `context.test.ts`:
  - `shipped map names only existing skills and PM files`: for each session, every `skills` entry has `skills/<name>/SKILL.md`; every `pmFiles` and `partial` entry is a `skills/pm-init/templates/<file>` or in `const SESSION_ONLY = ["PAUSE.md"]`; `handoff` is a stage name present in `skills/pm-init/templates/config.md`'s Handoffs table.
  - `parseMap rejects`: unknown key (`{..., foo: 1}`), a duplicate id, a missing `review` id, `skills: "pm-resume"` (not an array), a negative tidy limit; each throws `MapError`.
  - `parseMap accepts the shipped map` and returns 5 sessions in id order.

- [ ] **Step 3: Run** `bun test skills/pm-help/` — Expected: FAIL (`map.ts` missing).

- [ ] **Step 4: Implement `parseMap` and `loadMap` in `map.ts`.** Hand-written checks; the message names the path (`sessions[2].skills`).

- [ ] **Step 5: Run** `bun test skills/pm-help/` — Expected: PASS. Then temporarily rename `pm-resume` to `pm-resum` in `sessions.json`, run again, expect the first test to FAIL, and restore it.

- [ ] **Step 6: Add `skills/pm-help/`** to the `justfile` `test` recipe and the CI line; run `just test` — Expected: PASS.

- [ ] **Step 7: Commit** `feat(pm-help): session map for the context report (R-043)`.

### Task 2: Measuring sources

**Files:**
- Create: `skills/pm-help/scripts/sources.ts`
- Test: `skills/pm-help/scripts/context.test.ts`

**Interfaces:**
- Produces:

```ts
export interface Contributor { name: string; chars: number; tokens: number; partial: boolean; handoff?: boolean }
export const countChars: (text: string) => number;          // after \r\n -> \n
export const toTokens: (chars: number) => number;           // Math.ceil(chars / 4)
export function agentFiles(root: string): string[];         // existing of AGENTS.md, CLAUDE.md, in that order
export function agentSections(file: string, text: string): Contributor[]; // "<file>#pm-skills" for the marker block, "<file>#<## heading>" per section outside it, "<file>#preamble" for text before the first ##
export function findSkill(name: string, root: string, home: string): string | null; // folder path; spec "Locating skills" order; plugin-qualified names also search <home>/.claude/plugins/**/skills/<last>/SKILL.md, newest mtime wins
export function citedReferences(text: string, citingSkillDir: string | null, root: string, home: string): string[]; // absolute .md paths that exist
export function followReferences(start: string[], root: string, home: string): { files: string[]; missing: string[] }; // depth-first, each once; start = citation-source file paths
```

- [ ] **Step 1: Write the failing tests** against a temp repository built in `beforeEach` (`mkdtempSync`), with `home` set to a second temp folder:
  - `countChars("a\r\nb") === countChars("a\nb") === 3`; `toTokens(5) === 2`.
  - `agentSections`: a file `# T\n\nintro\n\n## A\n\nx\n\n<!-- pm-skills:start -->\n## B\n\nyy\n<!-- pm-skills:end -->\n\n## C\n\nz\n` gives names `AGENTS.md#preamble`, `AGENTS.md#A`, `AGENTS.md#pm-skills`, `AGENTS.md#C`, and their `chars` sum to `countChars` of the whole file. Without markers, `#pm-skills` is absent.
  - `agentFiles` returns both when `AGENTS.md` and `CLAUDE.md` exist, `[]` when neither does.
  - `findSkill("pm-x", ...)` finds `skills/pm-x` before `.claude/skills/pm-x`; `findSkill("sp:brain", ...)` finds `<home>/.claude/plugins/cache/m/sp/1.0.0/skills/brain`; an unknown name returns `null`.
  - `followReferences`: `skills/pm-a/SKILL.md` cites `references/a.md`; `a.md` cites `<pm-b skill>/references/b.md`; `b.md` cites `<pm-a skill>/references/a.md` (cycle) and `references/gone.md` → files are `a.md` and `b.md` once each, `missing` holds `gone.md`'s path.
  - A reference cited from `AGENTS.md` (`<pm-setup skill>/references/rules.md`) resolves to `skills/pm-setup/references/rules.md`.

- [ ] **Step 2: Run** `bun test skills/pm-help/` — Expected: FAIL (`sources.ts` missing).

- [ ] **Step 3: Implement `sources.ts`.** Citation pattern: `/(?:<([\w:-]+) skill>\/)?references\/([\w.-]+\.md)/g`; without a skill prefix it resolves in the citing file's skill folder (`citingSkillDir`), and from the agent file without a prefix it is ignored.

- [ ] **Step 4: Run** `bun test skills/pm-help/` — Expected: PASS.

- [ ] **Step 5: Commit** `feat(pm-help): measure agent sections, skills, and references (R-043)`.

### Task 3: The report

**Files:**
- Create: `skills/pm-help/scripts/context.ts` (report part)
- Test: `skills/pm-help/scripts/context.test.ts`

**Interfaces:**
- Consumes: `SessionMap` (Task 1), every export of `sources.ts` (Task 2).
- Produces:

```ts
export interface SessionReport { id: SessionId; chars: number; tokens: number; tokensWithoutHandoff?: number; contributors: Contributor[]; missing: string[] }
export interface TidyEntry { file: string; chars: number; limit: number }
export interface Report { version: 1; date: string; sessions: SessionReport[]; tidy: TidyEntry[] }
export interface ReportOptions { root: string; pmRoot: string; home: string; map: SessionMap; date: string }
export function buildReport(opts: ReportOptions): Report;
```

Rules (from the spec): `always` = agent sections only. Every other session = the agent files whole, plus its skills' `SKILL.md`, references followed from those skills and from the agent files, its `pmFiles` (whole), `partial` files (`partial: true`), its brief, decisions (`partial: true`, every `decisions/ADR-*.md`), inbox files (every `inbox/*.md` except `README.md`), and the handoff skill (`handoff: true`; `tokensWithoutHandoff` set only when one was counted). The handoff skill name is the Skill column of the `config.md` Handoffs row whose Stage equals `handoff`. Brief selection for `claim` and `checkpoint`: as the spec's `brief` bullet. Missing skills go in `missing` as `skill <name>`, a missing handoff as `handoff <name> not installed`, missing references by path. Missing PM files count nothing and are not listed. Contributors sorted by `chars` descending; contributor names are repository-relative `/` paths.

- [ ] **Step 1: Write the failing tests** with a synthetic repository (agent file, `skills/pm-resume/SKILL.md`, `skills/pm-next/SKILL.md`, `skills/pm-checkpoint/SKILL.md`, `skills/pm-review/SKILL.md`, a `planning/` with `config.md` holding a Handoffs row `| design | \`sp:brain\` | ... |`, `NOW.md` idle, `ROADMAP.md` with one ready agent item whose `Brief` exists, `LOG.md`, one ADR, one inbox file plus `README.md`):
  - `resume.chars` equals `always.chars` plus the exact `chars` of its listed files; `LOG.md`'s contributor has `partial: true`.
  - **Move guard:** move `## B` out of the agent file into `skills/pm-setup/references/rules.md` and add the line `Read <pm-setup skill>/references/rules.md.` to the agent file; `always.chars` drops, and `resume.chars` changes only by that added line's characters plus one newline.
  - `claim` counts the ready item's brief and the ADR (`partial: true`); with `sp:brain` installed under `home`, a `handoff: true` contributor and `tokensWithoutHandoff < tokens`; without it, `missing` holds `handoff sp:brain not installed`.
  - `review` counts the inbox file and not `inbox/README.md`.
  - Tidy: `ROADMAP.md` of exactly 32000 characters gives one entry with `limit: 32000`; 31999 gives none; a brief of 24000 gives one entry.
  - No PM root: `buildReport` returns five sessions and `tidy: []` without throwing.

- [ ] **Step 2: Run** `bun test skills/pm-help/` — Expected: FAIL.

- [ ] **Step 3: Implement `buildReport` in `context.ts`.**

- [ ] **Step 4: Run** `bun test skills/pm-help/` — Expected: PASS.

- [ ] **Step 5: Commit** `feat(pm-help): build the per-session context report (R-043)`.

### Task 4: CLI and output

**Files:**
- Modify: `skills/pm-help/scripts/context.ts` (CLI part, header comment in the `lint.ts` style)
- Test: `skills/pm-help/scripts/context.test.ts`

**Interfaces:**
- Consumes: `buildReport`, `loadMap`.
- Produces:

```ts
export function renderText(report: Report): string;   // exact layout in the spec's "Contributors and output"
export function main(argv: string[], env?: { cwd: string; home: string }): { code: 0 | 2; out: string };
```

`main` parses `[--root <dir>] [--pm-root <dir>] [--format text|json]`; `--pm-root` defaults to `PM state directory` in `AGENTS.md` or `CLAUDE.md`, else `planning/`, normalised as `pm-lint`'s `normalisePmRoot`. The script runs `main(process.argv.slice(2))` only under `import.meta.main`.

- [ ] **Step 1: Write the failing tests:**
  - `renderText` on a fixed `Report` gives exactly the spec's text example layout: heading `## Context <date>`, the 3-column table, at most 3 contributors per row as `<name> <tokens>` joined by `; `, `≤ ` before partial names, tokens rounded to the nearest 100 with `,` thousands separators (`21,700`), then `- PM state: no tidy needed` (or `- Tidy recommended: <file> <chars> characters (limit <limit>)`, one per entry, joined by `; `) and `- Estimated tokens are characters / 4; ≤ marks files read in part, counted whole.`
  - `main(["--format", "json"])` output parses and has `version: 1` and 5 sessions.
  - `main(["--format", "xml"])` and `main(["--bogus"])` return code 2; an invalid map (point `loadMap` at a temp file via an unexported test hook or `env`) returns code 2 with the `MapError` message.
  - `--pm-root planning` and `--pm-root .\\planning\\` both resolve to `planning/`.

- [ ] **Step 2: Run** `bun test skills/pm-help/` — Expected: FAIL.

- [ ] **Step 3: Implement `renderText` and `main`.**

- [ ] **Step 4: Run** `bun test skills/pm-help/` then `bun skills/pm-help/scripts/context.ts --root .` — Expected: PASS, and a table with 5 rows whose `always` row lists `AGENTS.md#pm-skills` first.

- [ ] **Step 5: Commit** `feat(pm-help): context report CLI (R-043)`.

### Task 5: pm-help diagnose and version

**Files:**
- Modify: `skills/pm-help/SKILL.md` (diagnosis table row 30, `## Output (overview)` template, the note after it, the `pm-help` skill guide row)
- Modify: `package.json` via `just bump prerelease`

- [ ] **Step 1: Add check 30** to the diagnosis table: `| 30 | If Bun is installed: \`bun <pm-help skill>/scripts/context.ts --root . --format json\` lists no \`tidy\` entry | \`<file> is <n> characters (limit <m>); tidy it\` | \`pm-park\` the tidy work |`.

- [ ] **Step 2: Add `## Context`** to the overview template after `## What's missing`: the script's text table and bullets, or `Context report needs Bun.` State below the template that the table is information, never a finding, that explain mode never runs it, and that the table is exempt from the 5-bullet limit.

- [ ] **Step 3: Update the `pm-help` guide row** ("What it writes" stays `Nothing`) to mention the context table if the row describes diagnose output; otherwise leave it.

- [ ] **Step 4: Run** `just bump prerelease` — Expected: `package.json` is `21.0.0-pre.7`.

- [ ] **Step 5: Run** `just validate` and `bunx markdownlint-cli2 skills/pm-help/SKILL.md` — Expected: both pass.

- [ ] **Step 6: Commit** `feat(pm-help): context table in diagnose (R-043)` with `package.json`.

### Task 6: Baseline report and verification

**Files:**
- Create: `planning/research/2026-11-24-context-baseline.md`

- [ ] **Step 1: Run** `bun skills/pm-help/scripts/context.ts --root .` and `--format json` on this branch.

- [ ] **Step 2: Write the report:** `# Context baseline 2026-11-24`, the command and `git rev-parse --short HEAD`, the text table verbatim, a table of the top five contributors per session from the JSON, the `claim` total with and without the handoff skill, and `## Next`: `R-046 Upgrade, format, and git rules move to references is the first cut; its always line must drop by at least 6,500 tokens from this baseline.`

- [ ] **Step 3: Run** `just pm-lint` — Expected: clean.

- [ ] **Step 4: Run** `just lint-check` and `just validate` — Expected: both pass.

- [ ] **Step 5: Commit** the report with the PM state as a PM commit (`docs(pm): R-043 context baseline`), through `git add -A -- planning` and `git commit -- planning`.
