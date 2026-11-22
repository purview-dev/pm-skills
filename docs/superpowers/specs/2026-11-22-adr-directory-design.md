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
- `pm-export` reads the ADR directory (read-only) into an `adrs` list in
  `planning.json` (`schemaVersion` 5), so agents can query ADRs and the docs
  site can show them.
- The docs-site package gains a **Decisions** view: every ADR listed, grouped
  by category or status, filtered by category and status, searched by text,
  and one page per ADR. A must (user, 2026-11-22).

## Non-goals

- No PM skill writes, numbers, or edits an ADR or creates the ADR folder.
- No new view in `skills/pm-docs-site/templates/` (STRATEGY.md Not doing):
  the templates only move to `schemaVersion` 5 and accept `adrs`. This
  repository's own `docs-site/` shows the view once R-013 Docs-site package:
  publish and migrate moves it onto the package.
- No `pm-lint` checks on ADR files: they are not PM files.
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
- Docs-site integration is a must: list, group, search, categories
  (2026-11-22).
- The site gets ADRs through the export, not by reading `docs/adr/`
  (2026-11-22).
- One item, size L, not sliced (2026-11-22). SCOPE CHANGE from the claimed
  size M; `R-033`'s roadmap `Size` and `Done when` are updated with `pm-item`
  after the workflow (Non-interruption rule 3 forbids it now).

## Approaches

Where the setting lives:

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. `## Architecture decisions` section in `config.md` and an **ADR** Shared definition | One clear owner, linted like `Commits`; one more config section | Chosen |
| B. A row in the Handoffs table | Reuses the framework-swap table, but ADRs are not a stage or a skill, so every reader of the table needs a special case | Rejected |
| C. A line under `## Location` | Smallest, but Location describes PM state and ADRs are not PM state | Rejected |

How the docs site gets ADRs:

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A. Export: `pm-export` adds `adrs` to `planning.json` (`schemaVersion` 5) | Site keeps reading the export only; agents can `find` ADRs; schema bump touches schema, example, fixtures, `planning.ts`, package and template types | Chosen |
| B. A site content loader reads `docs/adr/` directly | No schema bump; breaks the export-only rule for the site, and agents get nothing to query | Rejected |

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
  directory, `NNNN-<slug>.md` numbered from `0001`, in this format:

  ```markdown
  # <Title>

  - Status: proposed | accepted | superseded by NNNN | deprecated
  - Date: <YYYY-MM-DD>
  - Category: <architecture | data | security | tooling | testing | operations | another word>
  - Supersedes: <NNNN | none>
  - Item: <R-NNN | none>

  ## Context

  ## Decision

  ## Alternatives

  ## Consequences
  ```

  `Category` is free text; the list is the suggested set, and the docs site
  groups by whatever values exist. A decision is changed by a new
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

### 8. Export: `adrs` at `schemaVersion` 5

- `skills/pm-export/references/planning.schema.json`: `schemaVersion` const
  5; a required top-level `adrs` array (empty when the ADR directory is
  `none`, missing, or empty) and an `adrDirectory` string or `null`. Each
  ADR: `id` (the number as written, `"0001"`), `title`, `status`
  (`proposed | accepted | superseded | deprecated | <other text>`),
  `supersededBy` (id or `null`), `supersedes` (id or `null`), `date`
  (`YYYY-MM-DD` or `null`), `category` (text, `"uncategorised"` when
  missing), `item` (`R-NNN` or `null`), `path` (repository-relative), and
  `body` (the Markdown after the header, verbatim).
- `skills/pm-export/scripts/planning.ts`: read `ADR directory` from
  `config.md`; read every `*.md` file in it except `README.md` and
  `template.md`, sorted by id. Parse three header styles, first match wins,
  so an existing folder's format works: the default `- Key: value` bullets
  under the H1; YAML frontmatter (`status`, `date`, `category`, as MADR
  writes); a `## Status` section whose first line is the status (Nygard).
  The id is the file name's leading digits; the title is the H1 without a
  leading id. A file with no H1 or no leading digits is skipped with a
  warning, never a failure.
- `export.ts`: `check` covers ADRs (staleness against the files), `find`
  and `get` answer ADR ids and titles, `summary` counts ADRs by status.
- The schema, `planning.example.json`, the SKILL.md field map, and
  `planning.ts` change together (AGENTS.md); `export.test.ts` and the
  fixture repo `scripts/__fixtures__/repo/` gain a `docs/adr/` with one ADR
  per header style.
- The **Export file** definition in the managed section names the ADR
  directory as the one input read outside the PM root.

### 9. Docs-site package: the Decisions view

In `packages/pm-docs-site`:

- `planning-types.ts` and `planning.ts`: `SCHEMA_VERSION` 5 and the `Adr`
  type; the schema-version tests move to 5.
- Add `decisions` to `VIEWS`, on by default; its sidebar entry is hidden
  when `adrs` is empty.
- `/plan/decisions/`: a React island (the site's rule: rich, interactive,
  never static-first), with URL state like the board's
  (`useBoardUrlState` pattern), containing:
  - a text search over id, title, category, and body;
  - category chips (multi-select) and status chips, with `superseded` and
    `deprecated` hidden until their chip is on;
  - group by `category` (default), `status`, or `none`;
  - one row per ADR: id, title, status badge, category, date, and its item
    as a `RefLink` to the feature page.
- `/plan/decisions/<id>/`: one page per ADR with header badges, the body
  rendered as Markdown, links for `supersedes` and `supersededBy`, and the
  item link. These pages are in the Pagefind index, so the site's search
  finds ADRs.
- A feature page whose item an ADR names lists that ADR under "Decisions".
- The demo (`examples/demo/`) gains a `docs/adr/` with at least five ADRs
  over three categories, including one superseded, and its config sets
  `ADR directory: docs/adr/`; `just demo-check` covers the view.
- The package's own version moves forward (minor while pre-1.0), and the
  `pm-docs-site` SKILL.md and `references/spec.md` list the view.

In `skills/pm-docs-site/templates/site/`: `SCHEMA_VERSION` 5 and the
`adrs` type only, no view (Not doing). Re-render `docs-site/` with
`bun skills/pm-docs-site/scripts/site.ts write docs-site` and refresh its
fixture.

### 10. Version

`main` is `21.0.0-pre.2` and `v21.0.0` is not tagged, so this skills change
stays on rules 21 (AGENTS.md: unreleased prerelease line):
`just bump prerelease` to `21.0.0-pre.3`. Extend the `Version 21` upgrade note
in the managed section: ADR directory added and detected by `pm-setup` with
no question; the export moves to `schemaVersion` 5 with `adrs`, so run
`pm-export`, and `pm-docs-site upgrade` for an installed site. Then reinstall the managed section into
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
- `bun skills/pm-export/scripts/export.ts write` on the demo writes
  `schemaVersion` 5 with every demo ADR in `adrs`, `export.ts validate`
  passes, and `export.ts find 0001` returns the first ADR.
- On the demo site, `/plan/decisions/` lists every ADR grouped by category,
  a category chip and the text search each narrow the list, superseded ADRs
  appear only with their chip on, `/plan/decisions/0001/` renders the body,
  and the site search finds an ADR by a word from its body; covered by
  package tests and `just demo-check`.
- `just validate`, `just test`, `just lint-check`, `just docs-check`, and
  `just package-test` pass.

## Follow-ups after the workflow

- `pm-item` edit R-033: `Size: L` and this Done when.
- `pm-item` edit R-013 Docs-site package: publish and migrate: its Done when
  names a scratch export at `schemaVersion` 4; it becomes 5.
- `pm-item` edit R-037 Engineering export and docs-site view: "the next
  `schemaVersion`" is 6.

## Left to the builder

- Exact wording in each SKILL.md, within the Communication contract.
- Whether `pm-init` moves the "substantial code" finding into step 2 or sets
  the ADR value after step 3.
- Test fixture shape for the `config/adr` rule.
- The Decisions island's layout and styling, within the site's existing
  board and feature-table look; the five demo ADRs' content.
- How the body is rendered on the ADR page (the package's existing Markdown
  rendering for briefs or inbox ideas, if one exists).
- The scratch-repository rehearsal: a manual walk of `pm-init` step 2 on a
  temp repo, recorded in the plan's verification task; no report file is
  required for R-033.
