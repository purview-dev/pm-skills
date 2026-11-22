# R-033 ADR directory setting and design handoff: design

- Item: R-033 ADR directory setting and design handoff (M4 Recorded technical decisions, serves V5)
- Brief: `planning/briefs/2026-11-22-where-do-adrs-fit.md`
- Branch: `feat/r-033-adr-directory-setting-and-design-handoff`
- Date: 2026-11-22

## Intent

Technical decisions (why this library, why this pattern) are buried in each
item's design spec, so they are not findable later, and agents build items
that contradict them. ADRs (architecture decision records) become the home
for technical decisions in a consuming repository. The pm-* layer records
where they live and points the design stage and every session at them; it
never writes them (Non-interruption rule 6 keeps PM writes inside the PM
root).

## Goals

- A per-repository setting, `ADR directory`, in `<PM root>/config.md`.
- The design handoff (`pm-next` step 10) names the directory, tells the design
  skill to read the existing ADRs first, and to write one ADR per
  architecture decision its spec makes.
- The managed rules define an **ADR** and the decision split, and point every
  session (inside or outside the lifecycle) at the directory.
- `pm-init` and `pm-setup` set the value; `pm-help` diagnoses it; `pm-lint`
  checks it.

## Non-goals

- No PM skill writes, numbers, or edits an ADR or creates the ADR folder.
- No export change: `planning.json` and `schemaVersion` stay as they are
  (R-037 Engineering export and docs-site view covers export).
- No plan-stage citation or done-stage check against ADRs (R-036 Plan citation
  and done check).
- No `ENGINEERING.md` link (R-034, R-035).

## Anti-goals

- Turning ADRs on in an existing repository that does not use them. The user
  decided: off if the folder is not there.
- Asking extra setup questions. Detection decides; the user edits `config.md`
  to change it.
- Product decisions in ADRs. Product decisions stay in `STRATEGY.md`
  `## Decisions` and briefs (brief, 2026-11-22).

## Decisions made with the user

- ADRs record technical decisions only; `docs/adr/` is the default path,
  configurable; written by the design stage (brief).
- Default on only for a new project; off (`none`) for an existing repository
  without an ADR folder; an existing folder is detected and recorded
  (2026-11-22).
- Approach A: a new `config.md` section plus a Shared definition
  (2026-11-22).

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. `## Architecture decisions` section in `config.md` and an **ADR** Shared definition | One clear owner, linted like `Commits`; one more config section | Chosen |
| B. A row in the Handoffs table | Reuses the framework-swap table, but ADRs are not a stage or a skill, so every reader of the table needs a special case | Rejected |
| C. A line under `## Location` | Smallest, but Location describes PM state and ADRs are not PM state | Rejected |

## Design

### 1. The setting

`skills/pm-init/templates/config.md` gains, after `## Commits` and before
`## Last review`:

```markdown
## Architecture decisions

- ADR directory: none
```

Value: a repository-relative path ending in `/` (`docs/adr/`), or `none`,
written without backticks like `PM branch: main`. The lint rule accepts the
path with or without backticks, so a hand edit either way passes. The
template ships `none`; `pm-init` sets it. (Author's call after the builder
check.)

### 2. The ADR Shared definition (managed section)

In `skills/pm-setup/references/AGENTS-section.md` `## Shared definitions`,
add **ADR directory** and **ADR**:

- **ADR directory:** `ADR directory` in the `Architecture decisions` section
  of `<PM root>/config.md`: a repository-relative path, or `none`. A missing
  setting or section means `none`.
- **ADR:** one architecture decision record, one file in the ADR directory,
  written by the `design` handoff skill (never by a pm-* skill). It records a
  technical decision: architecture, technology, library, or pattern. The
  split: product decisions (whether and what) go in `STRATEGY.md`
  `## Decisions` and briefs; technical decisions in ADRs; one item's detail in
  its spec, which links the ADRs it writes or follows. Format: follow the
  directory's existing files (numbering, headings); in an empty or new
  directory, `NNNN-<slug>.md` numbered from `0001`, with the headings
  `Status` (`proposed | accepted | superseded by NNNN`), `Context`,
  `Decision`, `Alternatives`, `Consequences`. A decision is changed by a new
  ADR that supersedes the old one, never by rewriting an accepted one.
- **Every design handoff:** the ADR entry says that every invocation of the
  `design` handoff skill passes the ADR instruction (section 3), whichever
  skill starts it: `pm-next` step 10, `pm-next` resuming a `Paused
  checkpoint` at design, `pm-revise` rewind to design, `pm-checkpoint` pop
  back to design, and `pm-rejoin` at design. Only `pm-next` step 10 is
  edited to spell it out; the other routes rely on the Shared definition, so
  no further SKILL.md edits. (Author's call after the builder check.)
- **Every session:** when the ADR directory is not `none`, read its ADR
  titles before making a technical decision, and follow accepted ADRs, or
  write a superseding one through the design stage. Place this as one
  sentence in the ADR entry so ad-hoc sessions see it.

Also list `## Architecture decisions` wherever the managed section lists
`config.md`'s settings, if anywhere (builder: grep for `Export on commit` in
the section and mirror only where config sections are enumerated).

### 3. `pm-next` step 10

Append to the handoff text: when the **ADR directory** is not `none`, pass
its path, tell the design skill to read the existing ADRs before proposing
approaches and to write one ADR per architecture decision the spec makes,
in the directory's format (Shared definitions: ADR), and to link them from
the spec. When it is `none`, say nothing about ADRs.

### 4. `pm-init` step 2

After setting `PM branch`, set `ADR directory`:

- An existing folder among `docs/adr/`, `docs/decisions/`, `doc/adr/`,
  `docs/architecture/decisions/` (first found, in that order) is recorded.
- Otherwise, a new project is recorded as `docs/adr/`; an existing
  repository as `none`. "New project" is step 3's finding that the repository
  has no substantial code (more than a scaffold). Step 2 runs before step 3,
  so the builder moves that one finding earlier or sets the value after
  step 3; either is fine.
- No question is asked. The output `Note` states the value and why
  (`ADR directory: docs/adr/ (new project).`).

### 5. `pm-setup` step 4

When `<PM root>/config.md` lacks the `Architecture decisions` section or the
setting, detect as in `pm-init` (existing folder recorded, otherwise `none`;
an upgrade is never a new project) and write the section before
`## Last review`. No question. Report it in the output.

### 6. `pm-help` diagnosis

New row (next number after 26):

| Check | Finding | Fix |
| --- | --- | --- |
| `config.md` sets `ADR directory` | `ADR directory missing` | `pm-setup` |

Any value, including `none`, is the user's choice and is not reported: an
explicit `none` beside an existing folder is respected, because `pm-setup`
only writes a missing setting and the user changes it by editing
`config.md`. (Author's call after the builder check: the earlier mismatch
finding had a fix that changed nothing.) Also
add one line to the skill guide where config settings are explained, if such
a line exists.

### 7. `pm-lint`

- `structure.ts`: add the section to the optional-sections list (missing is
  allowed, reported like `Commits` as `config/optional-sections`), add
  `adr: ["ADR directory"]` to `KEYS` and to `config`'s key list, and a check:
  the value is `none` or a path ending in `/`, with or without backticks.
- New rule `config/adr` (error, not fixable) in `rules.ts` and
  `references/rules.md` with the same text, and a `lint.test.ts` case for a
  bad value and for `none`.
- A fresh `pm-init` install and the `pm-export` fixture still lint clean
  (`lint.test.ts` already requires it).

### 8. Version

`main` is `21.0.0-pre.2` and `v21.0.0` is not tagged, so this skills change
stays on rules 21 (AGENTS.md: unreleased prerelease line):
`just bump prerelease` to `21.0.0-pre.3`. Extend the `Version 21` upgrade note
in the managed section with one or two sentences: ADR directory added,
`pm-setup` detects it, no question. Then reinstall the managed section into
this repository's `AGENTS.md` (copy between markers, minus `version=`) and add
the setting to this repository's `planning/config.md` as `pm-setup` would
(`none`: no ADR folder exists here). `just validate` keeps them equal.

## Done when

- `pm-init` (per the SKILL.md steps, rehearsed in a scratch repository with
  `docs/adr/`) writes `ADR directory: docs/adr/` to `planning/config.md`, and
  `pm-lint check` passes on it.
- `pm-next` step 10 names the ADR directory and tells the design skill to read
  it and write one ADR per architecture decision.
- The managed section defines **ADR directory** and **ADR** with the product,
  technical, and spec split.
- `pm-help` reports a missing `ADR directory` with `pm-setup` as the fix.
- `just validate`, `just test`, and `just lint-check` pass.

## Left to the builder

- Exact wording in each SKILL.md, within the Communication contract.
- Whether `pm-init` moves the "substantial code" finding into step 2 or sets
  the ADR value after step 3.
- Test fixture shape for the `config/adr` rule.
- The scratch-repository rehearsal: a manual walk of `pm-init` step 2 on a
  temp repo, recorded in the plan's verification task; no report file is
  required for R-033.
