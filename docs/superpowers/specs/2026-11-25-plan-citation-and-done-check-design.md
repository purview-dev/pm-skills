# Plan citation and done check (R-036)

- Item: R-036 Plan citation and done check (Serves V5, Milestone M4)
- Brief: `planning/briefs/2026-11-20-technology-and-engineering-principles.md` (slice 3)
- Branch: `feat/r-036-plan-citation-and-done-check`
- ADRs written: ADR-013 Principles are matched and checked in prose (proposed), ADR-014 Purview packages are recorded at item close (proposed)
- ADRs followed: ADR-001 ADRs live in the PM root, ADR-009 Engineering file records state, ADRs reasons, ADR-010 Item close names captures, accepts ADRs in place

## Intent

`ENGINEERING.md` (R-034) and the decisions folder (R-033) record the
technology, principles, and decisions a repository follows, but only the
design stage is told about ADRs, and nothing checks finished work against
the principles. This item makes the record steer work at the two points
where it matters: the plan is told which principles and ADRs constrain it,
so its tasks cite them, and the close refuses work that breaks a principle
a command can check. An accepted Purview package reaches `ENGINEERING.md`
once it is really in use.

## Goals

1. **Every plan handoff** passes the ADRs the spec names and the principles
   that apply to the spec's files.
2. `pm-checkpoint` (`done`) checks the item's changed files against the
   principles: a failing `Check: <command>` blocks the close; a failing
   `Check: review` is a `Note` and an inbox file, and does not block.
3. A Purview package accepted through `pm-purview` is recorded in
   `ENGINEERING.md` when its item closes.
4. A rehearsal report in `planning/research/` shows all three, plus
   `pm-adr import docs/adr/`, in a scratch repository.

## Non-goals

- No script. Glob matching and the review are done by the agent from the
  skill text (approach A, chosen by the user on 2026-11-25).
- No execute-stage or design-stage principle handoff; the design handoff
  keeps its ADR instruction unchanged.
- No inference of `ENGINEERING.md` (R-035 dropped; `Not doing` in
  `STRATEGY.md`).
- No export or docs-site change: no new PM file, field, or record type.
  Review findings are ordinary inbox files, which the docs site already
  lists; the technology entry is an ordinary `ENGINEERING.md` block.

## Anti-goals

- The done check must never write a PM file before it decides to block: a
  refused close leaves the PM state as it was (`pause`, nothing written).
- A review finding must never block a close (brief, Enforcement answer).
- `ENGINEERING.md` must never list a package before it is installed
  (user, 2026-11-25).

## Constraints

- PM skills never edit plan files (Non-interruption rule 6), so the
  citation is passed in the handoff, not written into the plan.
- `pm-engineering` `add` cannot run during a workflow; `done` applies its
  write steps only, as it already does for `pm-adr accept` (ADR-010).
- The Completion record rides the branch and starts from the **PM base**
  (rules: Completion rides the branch).
- Skills change on the unreleased prerelease line `21.0.0-pre.12`
  (`v21.0.0` not tagged), so the rules stay at version 21 and
  `package.json` moves with `just bump prerelease`.

## Approaches

| Approach | Trade-off |
| --- | --- |
| A. Rules and skill text only (chosen) | Smallest change; no code to test. The agent matches globs and judges reviews by hand at every handoff and close, so two runs can disagree. |
| B. `pm-engineering check` mode backed by a Bun script (`applies`, `check`) | Deterministic and tested like `pm-export` and `pm-lint`; a script, tests, and a new mode to maintain. |
| C. A done-only script in `pm-checkpoint` | Deterministic at close, but the plan handoff still matches by hand, so the two can select different principles. |

The user chose A on 2026-11-25. Recommended was B; its strongest argument
was reproducibility. A is reversible: B can replace the matching later
without changing what the rules say happens.

## Design

### 1. Shared definition: Every plan handoff

Add to the managed section, after **Every design handoff**:

- **Every plan handoff** (`pm-checkpoint` `stage` after design, `pm-next`
  resuming a `Paused checkpoint` at `plan`, and a resume, `pop`, `rewind`,
  or `rejoin` into plan) lists:
  - **ADRs:** every `ADR-NNN` the spec names, as named references with
    their status, or `none`.
  - **Principles:** every principle in `ENGINEERING.md` whose
    `Applies to` is `all` or matches a path or glob the spec names, as
    `EP-NNN <title>: <Rule> (Check: <command | review>)`, or `none`. A
    missing `ENGINEERING.md` is `none`.
  - The instruction to the plan stage: cite the `EP-NNN` and `ADR-NNN`
    IDs in the tasks they constrain, and put each matching command check
    in the plan's verification steps.

Call sites, each referencing the definition instead of restating it (the
same pattern as **Every design handoff**): `pm-checkpoint` step 3 (`stage`,
when the next stage is `plan`) and step 8 (`pop` into plan), `pm-next`
(Paused checkpoint at `plan`), `pm-resume` step 6 (next action starts the
plan skill: list them, read-only), `pm-rejoin` step 7, `pm-revise` step 10
(`rewind` to plan).

Matching (my call): a path the spec names is any repository-relative path
or glob in it (backticked or in a file table). A glob matches when any
named path falls under it. When the spec names no paths, only `all`
principles apply, and the list says so.

### 2. `pm-checkpoint` (`done`): principles check

A new sub-step in step 5, after the `Done when` and plan-checkbox checks
and the spec's ADR check, and before **Check before writing**, so a block
writes nothing:

1. Changed files: `git diff --name-only <PM base>...HEAD` in the worktree
   that holds the item's branch, excluding the PM root. Read
   `ENGINEERING.md` from the **PM base**. Missing file or no matching
   principle: skip, with the Note `Principles: none apply.`
2. Each principle whose `Applies to` is `all` or matches a changed file:
   - `Check: <command>`: run it in the item's worktree. A non-zero exit
     keeps `done` in `pause`: list `EP-NNN <title>: <command> failed (exit
     <n>).` with the last 20 lines of output. Run every command check
     before stopping, so all failures are listed at once.
   - `Check: review`: read the diff of the matching files against `Rule`.
     Each break found is one Note line `EP-NNN <title>: <file> <finding>`
     and one inbox file by `pm-park` (`agent` mode, `Kind: tech-debt`,
     `Affects: <ID>`, `Source: agent (<ID> done)`). It never blocks.
3. Record the result as one Note: `Principles: <n> command checks passed,
   <m> review findings.`

Review findings are captures (ADR-010): swept into the record's commit when
written in the item's worktree, named in a Note otherwise.

### 3. Purview packages reach ENGINEERING.md at close

- `pm-purview` step 6 writes each accepted item's `Note:` with a fixed
  marker: `Purview package: <PackageId>.` alongside the docs URL and report
  path. Nothing is written to `ENGINEERING.md` at acceptance.
- `pm-checkpoint` (`done`), after **Accept the item's ADRs**: when the
  `Note` in `NOW.md` holds `Purview package: <PackageId>`, find it in the
  item branch's manifests (`*.csproj`, `Directory.Packages.props`,
  `Directory.Build.props`, `global.json` for an SDK). When found, apply
  `pm-engineering` `add technology` write steps only (no question, output,
  or commit): `Kind: library` (`tool` for an SDK), `Version` from the
  manifest, `Reason` the first sentence of `## Decision` in the ADR whose
  `Item` is this item and that names the package (accepted or still
  proposed), else `Adopted through <ID> <title> (pm-purview).`,
  `Decision` that ADR, or `none` when there is none, `Source` the manifest
  path, `Added` today. (Builder check, my call: `pm-engineering` step 1
  accepts a proposed ADR, and `Reason` is required by `engineering/values`,
  so it always has a value.) An existing entry of that name gets
  its `Version` changed instead. Not found: the Note `Purview package
  <PackageId> is not in a manifest; not recorded.`
- `ENGINEERING.md` joins the files read from the **PM base** and written in
  the item's worktree, so the entry rides the pull request. An uncommitted
  `ENGINEERING.md` in either worktree stops `done` like `ROADMAP.md`: it is
  not a capture.
- `pm-engineering` Guard names `pm-checkpoint` (`done`) as the one writer
  of its add steps during a workflow, as `pm-adr` names its `accept`.

### 4. Rules, help, and tables

- Managed section (`skills/pm-setup/references/AGENTS-section.md`):
  **Every plan handoff**; the done principles check in the **Completion
  record** definition (`ENGINEERING.md` added to the files it may write);
  a `Version 21` upgrade note. Reinstall the section in `AGENTS.md`
  (`pm-setup`, or the marker-bounded replacement).
- `pm-help` skill guide row for `pm-checkpoint` and `pm-engineering` if
  their purpose text changes.
- No `pm-lint` rule changes: `Note` is free text and no file format
  changes.
- `just bump prerelease`.

### 5. Rehearsal

Report: `planning/research/<YYYY-MM-DD>-m4-rehearsal.md`, in the format of
`planning/research/2026-11-24-context-baseline.md` (header list, then one
section per check with the commands and the output excerpts).

Fidelity (user, 2026-11-25): the rehearsal runs in a fresh agent session,
not as a walkthrough by the building agent. This branch's skills are
installed into the scratch repository (`bunx skills add <this repo path>
-y`, or links as `just setup-skills` makes), and every step below runs
the real skills, including a real `superpowers:writing-plans` run in step
3, so assumption A5 is tested honestly. The report records the session's
commands and output excerpts, and whether the produced plan cites the IDs.

Scratch repository in a new temp directory outside this repository:
`package.json`, a minimal `App.csproj` with a Purview `PackageReference`,
`docs/adr/0001-use-bun.md` and `0002-typescript-only.md` (MADR style),
`src/`. Steps, each recorded:

1. `pm-init`, then `pm-adr import docs/adr/`: both ADRs land in
   `planning/decisions/`.
2. `pm-engineering add principle`: EP-001 with a command check that fails
   when a `.js` file exists under `src/`, EP-002 with `Check: review`
   (`Applies to: src/**`).
3. A spec naming `src/` paths and an ADR: `pm-checkpoint stage` into plan
   lists EP-001, EP-002, and the ADR (goal 1). Record whether the plan the
   handoff produces cites them (assumption A5 in `STRATEGY.md`).
4. Add `src/a.js` and a review-breaking change; `pm-checkpoint done`
   refuses on EP-001 and writes nothing. Remove `a.js`; `done` closes,
   with the EP-002 finding as a Note and an inbox file (goal 2).
5. An item whose `Note` holds `Purview package: <Id>` closes and writes a
   technology block citing `App.csproj` (goal 3).

## Left to the builder

- Exact wording and placement of each call-site sentence.
- Which Purview package and principle commands the scratch repository uses.
- Whether `pm-help` rows need new text (only if a skill's purpose changes).
