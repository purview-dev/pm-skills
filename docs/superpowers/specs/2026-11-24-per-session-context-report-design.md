# R-043 Per-session context report: design

- Item: R-043 Per-session context report (Serves V2)
- Brief: `planning/briefs/2026-11-22-agent-context-tidy.md` (problem, alternatives, challenges, ramifications)
- Branch: `feat/r-043-per-session-context-report`
- ADRs: writes ADR-008 Context cost is estimated as characters / 4. Follows none of ADR-001 to ADR-007 (none touch this).

## Intent

Every agent session loads the agent instructions file; each PM session also
loads skill files and PM files. Nothing measures that cost. R-043 ships a
read-only report, in `pm-help`, that estimates the context each kind of
session loads. It is the baseline that R-046, R-047, R-048, and R-049 are
measured against while they cut the managed section from 69 KB to 15 KB and
trim the skills, so it must keep counting text after that text moves from
`AGENTS.md` into `skills/pm-setup/references/` files.

## Goals

- One line per session type (`always`, `resume`, `claim`, `checkpoint`,
  `review`) with estimated tokens and the three largest contributors.
- The same report in a consumer repository, from its own install and PM
  root.
- Text moved from the agent file into a cited reference file still counts,
  so a move never reads as a saving.
- A PM state line that recommends a tidy item once a PM file passes a size.
- A baseline table in `planning/research/`.

## Non-goals

- Exact token counts. The estimate is characters / 4 (ADR-008); relative
  change per session type is what the later slices need.
- Cutting anything. R-043 measures; R-046 onward cut.
- A `pm-tidy` skill. The PM state line only recommends one.
- Counting the conversation, tool output, or the harness's own prompt.

## Anti-goals

- A report that shows a saving when text only moved between files.
- A report that fails or exits non-zero on a missing optional file or an
  uninstalled skill: it is a diagnosis, so it reports what it finds.
- Any dependency beyond `node:` and `bun:` builtins.

## Constraints

- Dependency-free TypeScript run with Bun, like `pm-lint` and `pm-export`.
- Read-only: never writes a file, never runs git.
- A skills change on the unreleased `21.0.0-pre.N` line: `just bump
  prerelease` (to `21.0.0-pre.7`); the managed section does not change, so
  no marker bump and no `Version N` note.

## Approaches

| Option | Trade-off | Outcome |
| --- | --- | --- |
| A. Map in `sessions.ts` (typed code) | Type-checked, the `pm-lint` `rules.ts` pattern; a map change is a code change | Not chosen |
| B. Map in `skills/pm-help/references/sessions.json` | Editable as data, readable by an agent without running code; needs its own shape check in the script | **Chosen by the user (2026-11-24)** |
| C. Repository-only measure in `scripts/validate.ts` | No consumer change | Ruled out in the brief: consumers could not measure their install |

Decided with the user (2026-11-24): the map lists each session's skills and
PM files, and the script also follows every `references/*.md` file a
counted `SKILL.md` cites (**map plus followed references**); the `always`
line counts the **whole agent file**, broken down by section.

## Design

### Files

- `skills/pm-help/references/sessions.json`: the session map and the tidy
  thresholds.
- `skills/pm-help/scripts/context.ts`: the CLI and the report.
- `skills/pm-help/scripts/context.test.ts`: tests.
- `skills/pm-help/SKILL.md`: a `## Context` section in the overview output
  and diagnosis check 30.
- `planning/research/2026-11-24-context-baseline.md`: the baseline report.
- `justfile` (`test` recipe) and `.github/workflows/ci.yml` if it lists the
  test folders: add `skills/pm-help/`.

### CLI

```text
bun <pm-help skill>/scripts/context.ts [--root <dir>] [--pm-root <dir>] [--format text|json]
```

- `--root` defaults to the current directory. `--pm-root` defaults to the
  `PM state directory` in `AGENTS.md` or `CLAUDE.md`, else `planning/`
  (reuse `pm-lint`'s detection logic; copy it, because skills are installed
  separately and one skill's script must not import another's).
- Exit 0 on a report (even with missing skills or files), 2 on a usage
  error or an invalid `sessions.json`.

### The map: `sessions.json`

```json
{
  "version": 1,
  "sessions": [
    { "id": "always", "agentFile": true },
    { "id": "resume", "skills": ["pm-resume"], "pmFiles": ["config.md", "NOW.md", "ROADMAP.md", "STRATEGY.md", "STACK.md", "PAUSE.md"], "partial": ["LOG.md"] },
    { "id": "claim", "skills": ["pm-next"], "handoff": "design", "pmFiles": ["config.md", "NOW.md", "ROADMAP.md", "STRATEGY.md"], "partial": ["LOG.md"], "brief": true, "decisions": true },
    { "id": "checkpoint", "skills": ["pm-checkpoint"], "pmFiles": ["config.md", "NOW.md", "ROADMAP.md", "STRATEGY.md", "STACK.md"], "partial": ["LOG.md"], "brief": true },
    { "id": "review", "skills": ["pm-review"], "pmFiles": ["config.md", "NOW.md", "ROADMAP.md", "STRATEGY.md", "VISION.md", "RISKS.md"], "partial": ["LOG.md"], "inbox": true }
  ],
  "tidy": { "LOG.md": 32000, "ROADMAP.md": 32000, "brief": 24000 }
}
```

The file lists above are the builder's to confirm against each skill's
steps; the shape is fixed.

- `agentFile`: the agent instructions file. Every session includes it, so
  each non-`always` line is the `always` total plus its own files.
- `skills`: `pm-*` skill names; each contributes its `SKILL.md` and the
  references it cites (below).
- `handoff`: a Handoffs table stage in `<PM root>/config.md`. The named
  skill (for example `superpowers:brainstorming`) is counted when its
  `SKILL.md` is found, and shown as `handoff: <skill>`; when it is not
  found, the line notes `handoff <skill> not installed` and counts nothing.
- `pmFiles`: PM-root-relative files read whole. `partial`: files read in
  part (Context budget); counted whole and marked `≤` as an upper bound.
- `brief`: the brief the session reads. For `claim`, the `Brief` of the
  item `pm-next` would take: the active item's when `NOW.md` is active,
  else the first `## Next` item with `Owner` `agent` or `both` and
  `Status` `ready` or `paused` (dependency check skipped; an estimate).
  For `checkpoint`, `NOW.md`'s `Brief`, else the same item as `claim`.
  None found counts 0.
- `decisions`: every ADR file in `<PM root>/decisions/` except `README.md`,
  marked `≤` (the design handoff lists them all and reads the ones its
  decision touches). Set on `claim`.
- `inbox`: every inbox file except `README.md`.
- Missing optional files count as 0 and are not listed.
- The script checks the shape (known keys, types, unique `id`s, the five
  required ids) and exits 2 with the first problem.

### Followed references

Citation sources are each counted `SKILL.md` and the agent file. A
reference cited by the agent file (R-046 and R-047 will have the managed
section point at `<pm-setup skill>/references/rules.md` and the like) is
counted on every non-`always` line, because each PM skill reads it once per
session, and never on the `always` line, because it is not loaded at
start. This is what makes a move show as a lower `always` and an unchanged
PM session. Today no counted skill cites a reference, so the mechanism is
for the slices that follow; the tests pin it with a synthetic repository.

From each citation source, find cited reference files with the pattern
`(?:<([\w:-]+) skill>/)?references/([\w.-]+\.md)`: with a `<pm-x skill>/`
prefix it resolves in that skill's folder, without one in the citing
skill's folder. Follow references cited by references too, depth-first,
each file counted once per session. Only `.md` files count; scripts,
schemas, and templates are run or copied, not read into context. A cited
file that does not exist is listed as `missing reference` in the JSON and
counted as 0.

Builder's call: the exact regex, provided R-046's `<pm-setup
skill>/references/rules.md` style citations and today's `references/`
citations both resolve.

### Locating skills and the agent file

- Skill folders, first found wins: `skills/<name>/`, then `.agents/skills/`,
  `.claude/skills/`, `.copilot/skills/`, `.github/skills/` under the root,
  then the same under the user's home directory (`pm-setup` step 2). A
  plugin-qualified name (`superpowers:brainstorming`) searches for its
  last segment, and also `~/.claude/plugins/**/<plugin>/**/skills/<name>/SKILL.md`
  (Claude Code plugins; newest modified wins), so the design handoff counts
  in this repository. Because a handoff skill's location depends on the
  machine, it is its own contributor marked `handoff`, and the JSON gives
  the `claim` total with and without it.
- A skill not found is shown as `missing: <name>` on its line and counted as
  0, never a failure.
- Agent file: every one of `AGENTS.md` and `CLAUDE.md` in the root that
  exists, both counted when both exist.

### Contributors and output

Contributors are files, except on the `always` line, where they are
sections of the agent file: the managed section (between the
`pm-skills:start` and `pm-skills:end` markers) as one contributor, and each
`##` section outside it as one contributor.

Text output:

```markdown
## Context 2026-11-24

| Session | Est. tokens | Largest |
| --- | --- | --- |
| always | 21,700 | pm-skills section 17,400; Project structure and architecture 1,900; Build, test, and lint 1,900 |
| resume | 27,900 | AGENTS.md 21,700; pm-resume/SKILL.md 3,300; ≤ planning/LOG.md 1,800 |
| claim | ... | ... |
| checkpoint | ... | ... |
| review | ... | ... |

- PM state: no tidy needed | Tidy recommended: planning/ROADMAP.md 33,100 characters (limit 32,000)
- Estimated tokens are characters / 4; ≤ marks files read in part, counted whole.
```

Numbers are rounded to the nearest 100 with thousands separators in text;
JSON carries exact characters and tokens (`Math.ceil(chars / 4)`):

```json
{ "version": 1, "date": "2026-11-24", "sessions": [ { "id": "always", "chars": 0, "tokens": 0, "contributors": [ { "name": "AGENTS.md#pm-skills", "chars": 0, "tokens": 0, "partial": false } ], "missing": [] } ], "tidy": [ { "file": "planning/ROADMAP.md", "chars": 0, "limit": 32000 } ] }
```

The JSON lists every contributor; the text shows the three largest.
Characters are counted on the file's text as read (UTF-8 decoded, line
endings normalised to `\n`, so Windows and Linux give the same number).

### PM state line

`tidy` limits are in characters: `LOG.md` 32,000 and `ROADMAP.md` 32,000
(about 8,000 tokens each), and any single brief 24,000. Today the largest is
`ROADMAP.md` at about 20,000. Each file at or over its limit is one entry.
Designer's call (2026-11-24), adjustable in the JSON.

### pm-help

- Overview output gains a `## Context` section after `## What's missing`:
  the text table and the two bullets, from `bun <pm-help
  skill>/scripts/context.ts --root .`. Without Bun: `Context report needs
  Bun.` Explain mode never runs it.
- Diagnosis check 30: `If Bun is installed: the context report's PM state
  line recommends no tidy` | `<file> is <n> characters (limit <m>); tidy
  it` | `pm-park` the tidy work (the deferred `pm-tidy` slice). A tidy
  entry is a finding; the table is information, never a finding.
- No change to the skill guide row's meaning; mention the context table in
  `pm-help`'s row if the row lists what diagnose shows.

### Tests (`context.test.ts`, in `just test`)

- The shipped `sessions.json` names only skills that exist under
  `skills/` (plugin-qualified handoffs excepted) and PM files that exist in
  `skills/pm-init/templates/` or are in the test's short allowlist of
  session files no template creates (`PAUSE.md`, written by `pm-pause`)
  (this is the Done when test: it fails when the map names a missing skill
  or file).
- A reference cited only by the agent file counts on `resume` and not on
  `always`.
- A synthetic repository (temp folder) gives exact characters per session:
  agent file split into managed section and `##` sections; a skill citing
  `references/a.md`, which cites `<pm-other skill>/references/b.md`, counts
  both once; a missing reference is listed, not fatal.
- Moving a section from the agent file into a cited reference leaves the
  `resume` total unchanged and lowers `always` (the anti-goal guard).
- `partial` files carry `partial: true`; a missing optional file counts 0;
  a missing skill is reported, exit 0; an invalid `sessions.json` exits 2.
- CRLF and LF copies of a file give the same count.
- A tidy entry appears at the limit and not one character below.

### Baseline report

`planning/research/2026-11-24-context-baseline.md`, written in execute from
`context.ts --root .` on this branch: the text table, the JSON's top five
contributors per session, the command and commit it ran on, and a
`## Next` line naming R-046 as the first cut. It follows the PM file
format for `research/` (pm-lint clean).

### Docs site

Nothing. The report is a session diagnosis printed by `pm-help`, not PM
state, a file format, a setting, or a record a user browses; the baseline
report sits in `planning/research/`, which the export does not carry.

## Designer's calls after the builder check (2026-11-24)

- The agent file is a citation source; its references count on PM session
  lines only.
- `claim` takes its brief from the item `pm-next` would take, and counts
  the decisions folder as `≤`.
- `PAUSE.md` stays on `resume`, allowlisted in the map test.
- Docs site: nothing (above).
- Claude Code plugin folders are searched for the handoff skill, shown as
  a separate, machine-dependent contributor.

## What is left to the builder

- The exact file lists per session, checked against each skill's steps.
- The reference-citation regex, within the rule above.
- Internal structure of `context.ts` (one file or split), and the text
  table's column widths.
- Whether the CI workflow needs the new test folder or runs `just test`.

## Done when

- `bun skills/pm-help/scripts/context.ts --root .` prints one line per
  session type (`always`, `resume`, `claim`, `checkpoint`, `review`) with
  estimated tokens and the three largest contributors.
- `pm-help` diagnose prints that table in `## Context`.
- `planning/research/2026-11-24-context-baseline.md` records the baseline
  table.
- `context.test.ts` fails when `sessions.json` names a missing skill or
  file.
- `just lint-check` and `just validate` pass.
