# R-033 ADR record, pm-adr, and design handoff: design

- Item: R-033 ADR directory setting and design handoff, renamed by this design
  to "ADR record, pm-adr, and design handoff" (M4 Recorded technical
  decisions, serves V5)
- Brief: `planning/briefs/2026-11-22-where-do-adrs-fit.md`
- Branch: `feat/r-033-adr-directory-setting-and-design-handoff`
- Date: 2026-11-22
- Slice: 1 of 3 (slices 2 and 3 are under Follow-ups)

## Intent

Technical decisions (why this library, why this pattern) are buried in each
item's design spec, so they are not findable later, and agents build items
that contradict them. ADRs (architecture decision records) become PM state:
one file per decision in `<PM root>/decisions/`, owned by a new skill,
`pm-adr`, linted like every PM file, and read by the design stage and every
session before a technical decision is made.

## Goals

- An **ADR** record in the PM root, with IDs `ADR-NNN` that are never reused.
- `pm-adr`: create, supersede, deprecate, view, check, and import ADRs.
- The design stage records each architecture decision with `pm-adr`, which
  may write during the workflow like a capture.
- The managed rules define the ADR, the decision split, and the read-before-
  deciding rule for every session.
- `pm-lint` checks ADR files; `pm-init` sets up the folder for a new project.

## Non-goals (this slice)

- Export and the docs-site Decisions view: slice 2.
- ADR awareness in `pm-shape`, `pm-discover`, `pm-revise`, `pm-checkpoint`
  (`done`), `pm-review`, `pm-purview`, `pm-status`, and the `pm-help`
  diagnosis: slice 3. This slice adds only the `pm-help` skill-guide row the
  new skill requires.
- Plan citation of ADRs: R-036 Plan citation and done check.

## Anti-goals

- ADRs created in an existing repository that does not ask for them: no
  folder is created there until the first `pm-adr` write.
- Product decisions in ADRs: they stay in `STRATEGY.md` `## Decisions` and
  briefs.
- Questions in the middle of a design: `pm-adr` in the workflow never asks.

## Decisions made with the user

- ADRs record technical decisions only (brief, 2026-11-22).
- Off unless asked for in an existing repository; part of `pm-init` for a new
  project (2026-11-22).
- The docs site must list, group, search, and categorise ADRs, through the
  export (2026-11-22); built in slice 2.
- A skill manages ADRs, and ADRs live in the PM root, so PM skills keep
  writing only inside it (2026-11-22). This reverses the earlier
  `docs/adr/` and `ADR directory` setting decisions; the brief's
  `## Revisions` records it after the workflow.
- Eight skills account for ADRs (2026-11-22); built in slice 3.
- Three items in order (2026-11-22).
- Every skill feature considers the docs site (AGENTS.md, commit `ef315ea`).

## Approaches

Where ADRs live and who writes them:

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| `docs/adr/` written by the design stage, a config setting points at it | No PM ownership; a managing skill would break rule 6 | Superseded by the user's choice |
| `docs/adr/` with a rule-6 exception for `pm-adr` | Keeps ADRs beside the code; a second write boundary to explain and guard | Rejected |
| `<PM root>/decisions/`, owned by `pm-adr` | Same boundary as every PM file; linted, exported, committed by PM commits; an existing outside folder is imported, not managed in place | Chosen |

## Design

### 1. The ADR record (managed section, Shared definitions)

- **Decisions folder:** `<PM root>/decisions/`, an **Optional file** (a
  missing folder means no ADRs). Holds `README.md` and one file per ADR.
- **ADR IDs:** `ADR-NNN` (at least 3 digits), separate from item and risk
  IDs. A new ID is the highest `ADR` number in the folder plus 1. Never
  reused: a deprecated or superseded ADR keeps its file.
- **ADR:** one technical decision (architecture, technology, library, or
  pattern) at `<PM root>/decisions/ADR-NNN-<slug>.md`, written only by
  `pm-adr`:

  ```markdown
  # ADR-001 <Title, max 8 words>

  - Status: proposed | accepted | superseded by ADR-NNN | deprecated
  - Date: <YYYY-MM-DD>
  - Category: <architecture | data | security | tooling | testing | operations | another word>
  - Supersedes: <ADR-NNN | none>
  - Item: <R-NNN | none>
  - Source: <imported path | none>

  ## Context

  ## Decision

  ## Alternatives

  ## Consequences
  ```

  `Category` is free text; the list is the suggested set. An accepted ADR is
  never rewritten: a change is a new ADR that supersedes it.
- **Decision split:** product decisions (whether and what) go in
  `STRATEGY.md` `## Decisions` and briefs; technical decisions in ADRs; one
  item's detail in its spec, which names the ADR IDs it writes or follows.
- **Read before deciding:** any session, inside the lifecycle or not, reads
  the accepted ADR titles in the decisions folder before a technical
  decision, follows them, or supersedes one through `pm-adr`.
- **Named reference:** add `ADR-NNN <title> (<status>)` to the Named
  reference and Reference legend definitions.
- **Every design handoff** (`pm-next` step 10, a resume or `pop` or
  `rewind` or `rejoin` into design) passes the ADR instruction in section 4.

### 2. `pm-adr` (new skill, `skills/pm-adr/SKILL.md`)

| Mode | Effect | During a workflow |
| --- | --- | --- |
| `new` | Write one ADR with the next ID, `Status: proposed` unless the caller says `accepted`, today's date | Yes, quick write (section 3) |
| `supersede <ADR-NNN>` | Write the new ADR with `Supersedes`, set the old one's `Status: superseded by <new>` | Yes, quick write |
| `accept <ADR-NNN>` | `proposed` to `accepted` | Yes, quick write |
| `deprecate <ADR-NNN>` | `Status: deprecated`, with the reason appended under `## Consequences` | No |
| `view [<ADR-NNN>]` | One ADR, or the list grouped by category, then status | Yes, read-only |
| `check` | Missing fields, broken `Supersedes` links, duplicate IDs (runs `pm-lint` on the folder when Bun is present) | Yes, read-only |
| `import <folder>` | Copy every ADR in an outside folder (for example `docs/adr/`) into the decisions folder with new IDs in the source order, mapping its header style (field bullets, MADR frontmatter, a `## Status` section) to the format, the body verbatim, and `Source` set; the originals stay | No; asks one confirmation question listing the files |

- Outside a workflow, `new` and `supersede` apply Challenge protocol checks
  3 (alternatives) and 7, writing them under `## Alternatives`, and end with
  a PM commit `docs(pm): record ADR-NNN <slug>`.
- Output: a fixed template (`## ADR` with ID, title, status, category, path,
  and `## Note` with the commit result), per the Communication contract.
- Listed in the README table, the managed-section table, the `pm-setup`
  inventory, and the `pm-help` skill guide (`just validate` requires all
  four); `pm-setup`'s skill counts move up by one.

### 3. Non-interruption rules

- Rule 2 and rule 3: `pm-adr` `new`, `supersede`, and `accept` may run during
  the active item's workflow, in the session that owns it, when the workflow
  makes or confirms a technical decision. Like a capture, each writes one or
  two ADR files, replies in one line (`Recorded ADR-NNN <title>
  (<status>).`), never asks, and never commits; the next PM commit (usually
  `pm-checkpoint` `stage`) commits them. `view` and `check` join the
  read-only exceptions.
- Committing PM state: add `pm-adr` in the workflow to the "never commits"
  list beside `pm-park` and `pm-risk` capture.

### 4. `pm-next` step 10

Append: list the accepted and proposed ADRs (named references) from the
decisions folder, or say there are none. Tell the design skill to read the
ones its decision touches before proposing approaches, to record each
architecture decision the spec makes with `pm-adr new` (or `supersede`),
and to name the ADR IDs in the spec.

### 5. `pm-init`

- New template `skills/pm-init/templates/decisions-README.md` (what an ADR
  is, the split, and that `pm-adr` writes them), copied to
  `<PM root>/decisions/README.md` only for a new project (step 3's "no
  substantial code" finding; the builder moves that finding before the copy
  or copies after step 3).
- When the repository has an outside ADR folder (`docs/adr/`,
  `docs/decisions/`, `doc/adr/`, `docs/architecture/decisions/`), the output
  `Note` recommends `pm-adr import <folder>`. Nothing is imported
  automatically. `pm-setup` adds the same Note on upgrade.

### 6. `pm-lint`

New file kind `adr` for `<PM root>/decisions/ADR-*.md` (`README.md`
excluded), with rules in `scripts/rules.ts`, `references/rules.md`, and
`lint.test.ts`, added together:

- `adr/header`: the H1 is `ADR-NNN <title>`, and the six fields are present
  in order with allowed values (`Status` pattern, `Date` as `YYYY-MM-DD`,
  `Supersedes` and `Item` as an ID or `none`).
- `adr/sections`: `Context`, `Decision`, `Alternatives`, `Consequences` in
  order.
- `adr/id`: the file name's ID equals the H1's, and no two files share one.
- `adr/links`: `Supersedes` and `superseded by` name existing ADRs, and each
  pair agrees; `Item` names an ID found in `ROADMAP.md`, `NOW.md`, or
  `LOG.md`.

A fresh `pm-init` install (with and without the decisions README) and the
`pm-export` fixture still lint clean. `pm-export`'s `write` ignores the
folder until slice 2, and its `check` is unaffected.

### 7. Docs site (AGENTS.md convention)

Surfaced in slice 2: the export's `adrs` list and the package's Decisions
view (list, group by category or status, category and status filters, text
search, one page per ADR, feature pages listing their ADRs). This slice adds
no surface; the slice 2 item is added before this item closes.

### 8. Version

`main` is `21.0.0-pre.2` and `v21.0.0` is not tagged, so this skills change
stays on rules 21: `just bump prerelease` to `21.0.0-pre.3`. Extend the
`Version 21` upgrade note: adds `pm-adr` and the decisions folder (optional;
`pm-adr import` brings an existing folder in). Reinstall the managed section
into this repository's `AGENTS.md` (between the markers, minus `version=`);
`just validate` keeps them equal.

## Done when

- `pm-adr new` in this repository writes
  `planning/decisions/ADR-001-<slug>.md` in the format, and `just pm-lint`
  passes; `pm-adr supersede ADR-001` writes `ADR-002` and sets ADR-001's
  status to `superseded by ADR-002`, and lint passes.
- `lint.test.ts` fails a bad `Status`, a missing section, a duplicate ID,
  and a broken `Supersedes` link, and passes the default format.
- `pm-adr import` on a scratch folder with one field-bullet, one MADR, and
  one Nygard-style ADR writes three linted ADRs with `Source` set.
- `pm-next` step 10 lists the ADRs and tells the design skill to record each
  architecture decision with `pm-adr`.
- The managed section defines the decisions folder, ADR IDs, ADR, the split,
  and the read-before-deciding rule, and Non-interruption rules 2 and 3 name
  `pm-adr`.
- `pm-adr` is in the README, managed-section, `pm-setup`, and `pm-help`
  tables, and `just validate`, `just test`, and `just lint-check` pass.

## Follow-ups after the workflow

- `pm-item` edit R-033: title "ADR record, pm-adr, and design handoff",
  `Size: M`, and this Done when.
- `pm-item add` (top of Next, after R-033, M4, serves V5):
  - **ADR export and Decisions view** (M): `adrs` in `planning.json` at
    `schemaVersion` 5, read from `<PM root>/decisions/`; the package's
    Decisions view (React island with text search, category and status
    chips, superseded hidden by default, group by category or status, URL
    state; one indexed page per ADR; feature pages list their ADRs); demo
    ADRs; templates move to `schemaVersion` 5 without a view. Depends on
    R-033.
  - **ADRs across the PM skills** (M): `pm-shape` and `pm-discover` read
    ADRs as evidence and challenge contradictions; `pm-revise` supersedes an
    ADR when a correction reverses it; `pm-checkpoint` (`done`) checks the
    spec's ADR IDs exist; `pm-review` lists ADRs `proposed` longer than the
    review cadence; `pm-purview` records an accepted recommendation as an
    ADR; `pm-status` counts ADRs by status; `pm-help` diagnoses unaccepted
    and broken ADRs. Depends on R-033.
- `pm-item` edit R-013 Docs-site package: publish and migrate (its
  `schemaVersion` 4 check becomes 5) and R-037 Engineering export and
  docs-site view (`schemaVersion` 6), once the export item is added.
- `pm-revise` or `pm-shape`: add a `## Revisions` line to the brief: ADRs
  moved into the PM root under `pm-adr`; the `ADR directory` setting is
  dropped.

## Left to the builder

- Exact SKILL.md wording, within the Communication contract.
- Where the "new project" finding moves in `pm-init`.
- The `decisions-README.md` text.
- Test fixture shapes for the `adr/*` rules and the import scratch folder.
