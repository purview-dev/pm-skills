# R-039 ADRs across the PM skills: design

- Item: R-039 ADRs across the PM skills (M4 Recorded technical decisions,
  serves V5)
- Brief: `planning/briefs/2026-11-22-where-do-adrs-fit.md`
- Branch: `feat/r-039-adrs-across-the-pm-skills`
- Date: 2026-11-22
- Slice: 3 of 3 of the ADR work (slice 1 is R-033,
  `docs/superpowers/specs/2026-11-22-adr-record-design.md`; slice 2 is R-038)
- ADRs: follows ADR-001 ADRs live in the PM root (accepted); records ADR-003
  Item close accepts its spec's ADRs (proposed)

## Intent

R-033 made ADRs PM state and taught `pm-next` to hand them to the design
stage; R-038 exported and rendered them. The other PM skills still ignore
them, so an idea can be shaped, a correction made, or an item closed against
a recorded technical decision without anyone noticing, which is problem 2 in
the brief (agents build items that contradict earlier decisions). This slice
makes every skill that meets a technical decision read, respect, or update
the ADRs, always through `pm-adr`.

## Goals

- `pm-shape` and `pm-discover` read the accepted ADR titles and challenge an
  idea or finding that contradicts one.
- `pm-revise` supersedes an ADR that a correction reverses.
- `pm-checkpoint` (`done`) refuses to close when the spec names an ADR ID
  with no file, and accepts the proposed ADRs the spec names.
- `pm-review` triages ADRs left `proposed` longer than the review cadence.
- `pm-purview` records an accepted recommendation as an accepted ADR.
- `pm-status` counts ADRs by status; `pm-help` diagnoses stale proposed ADRs
  and broken ADRs.
- Every re-entry into the design stage passes the ADR instruction.

## Non-goals

- Plan citation of ADRs and principles: R-036 Plan citation and done check.
- Any change to the ADR file format, `pm-lint`'s `adr/*` rules, the export,
  or the docs site.
- `pm-engineering` and `ENGINEERING.md`: R-034 to R-037.

## Anti-goals

- A second writer of ADR files. Every ADR change goes through a `pm-adr`
  mode (Shared definitions: ADR, "written only by `pm-adr`").
- Questions in the middle of a workflow. Anything that happens during a
  workflow (`pm-revise`'s supersede, `done`'s accept) follows `pm-adr`'s
  in-workflow behaviour: no questions, one-line reply, no commit of its own.
- Restating the shared definitions in each skill. Skills cite **Every design
  handoff**, **ADR**, and **Read before deciding** by name (AGENTS.md:
  skills must not redefine them).

## Decisions made with the user

- `pm-checkpoint` (`done`) accepts the proposed ADRs the spec names
  (2026-11-22). A spec ID with no ADR file blocks the close.
- The per-skill behaviour below was played back and approved (2026-11-22).
- Approach: one step in each skill, citing the shared definitions
  (2026-11-22; the user handed over the how with "go").

## Approaches

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| A step in each skill at the point it acts, citing the shared definitions; writes go through `pm-adr` modes | Eleven small edits; each skill reads whole on its own | Chosen |
| One "ADR touchpoints" table in the managed section that skills point at | One place for the policy; every consumer's agent file grows and every session loads it, though only the skills need it | Rejected |
| New `pm-adr` modes (`stale`, `count`) that the other skills call | Keeps ADR logic in one skill; `pm-status` and `pm-help` would call a skill to count files, and `pm-adr` gains modes no user asks for | Rejected |

## Design

### 0. Calling `pm-adr` from another skill

When a skill below "runs `pm-adr <mode>`", it applies that mode's write
steps only: no `pm-adr` output, no `pm-adr` commit, no `pm-adr` questions
(the calling skill has already asked what it needs). The calling skill's
own PM commit covers the ADR files (rules: Committing PM state, one commit
per skill run), and its output names each ADR changed as
`ADR-NNN <title> (<status>)` in its `## Note` or its own change list. During
a workflow this is `pm-adr`'s in-workflow behaviour already.

### 1. Managed section (`skills/pm-setup/references/AGENTS-section.md`)

- **ADR** (Shared definitions): append one sentence: `pm-checkpoint`
  (`done`) accepts the proposed ADRs the item's spec names, so `proposed`
  means a decision not yet built.
- **Version 21 upgrade note:** append one paragraph: the PM skills now read
  ADRs (`pm-shape`, `pm-discover`), update them through `pm-adr`
  (`pm-revise`, `pm-review`, `pm-purview`, `pm-checkpoint` `done`), report
  them (`pm-status`, `pm-help`), and every re-entry into design passes the
  ADR instruction. No setting is added.
- Nothing else changes: **Every design handoff** already names the
  re-entries; this slice makes the skills honour it.
- Reinstall the section into this repository's `AGENTS.md` (between the
  markers, minus `version=`); `just validate` keeps them equal.

### 2. Re-entries into design

Each cites **Every design handoff** (Shared definitions) and applies it only
when the stage it hands off to is `design`:

| Skill | Where |
| --- | --- |
| `pm-next` | The `Paused checkpoint` paragraph after step 10: when the recorded stage is `design`, pass step 10's ADR instruction |
| `pm-checkpoint` | `pop` (step 8): when the restored `Stage` is `design` |
| `pm-revise` | `rewind` to `design` and the step 10 hand back |
| `pm-rejoin` | `repair`, step 7 hand off, when `Stage` is `design` |
| `pm-resume` | The `Do this next` action when `Stage` is `design`: list the ADRs (named references) or say there are none, and tell the user the design skill is to read them first |

`pm-resume` stays read-only: it lists, it does not invoke.

### 3. `pm-shape` and `pm-discover`

- `pm-shape` step 2 (Ground it in evidence) and `pm-discover` step 3 (Gather
  evidence) read the titles of the accepted ADRs (Read before deciding). A
  missing decisions folder means none.
- When the idea, proposal, or a finding contradicts an accepted ADR, state
  it as a challenge with evidence (`ADR-002 <title> (accepted) says X; this
  needs Y`): `pm-shape` in step 5 (Challenge) as one choice question
  (`Change the idea (recommended)`, `Keep it; design supersedes ADR-NNN`,
  `Explain ADR-NNN`), recorded in `## Challenges and answers`; `pm-discover`
  in step 4 (Challenge the findings), recorded in the report.
- Neither skill supersedes the ADR. Shaping decides whether and what; when
  the user keeps the idea, the brief's `## Decision` or the report names the
  ADR to supersede, and the design stage runs `pm-adr supersede`.

### 4. `pm-revise`

- Step 2 (Inspect) reads the ADR IDs the item's spec names, and those whose
  `Item` is the target item.
- When the revision scope reverses the decision of one of them (accepted or
  proposed):
  - `rewind` and `fix-in-place`: run `pm-adr supersede <ADR-NNN>` with the
    corrected decision from the scope answer, `Item` the active item, and
    name it in the brief's `## Revisions` line and the output.
  - `new item` and `park`: write `Supersedes ADR-NNN <title>` into the new
    item's `Note` or the inbox file's `## Notes`; the new item's design
    stage supersedes it.
- No question is added: the scope answer already states the new decision.
  If it does not state one, the reversed ADR is named in the `## Revisions`
  line and left for the design stage.

### 5. `pm-checkpoint` (`done`)

In step 5, after the `Done when` and plan-box checks, before the commit
worktree is chosen:

- Read every `ADR-\d{3,}` ID in the spec (`Spec` in `NOW.md`); no spec or
  no IDs means nothing to check.
- An ID with no file in the item branch's decisions folder: stay in
  `pause`, like an unproven check, and list `ADR-NNN named in <spec> has no
  file.` This applies to every ID the spec names, because a dangling
  reference is broken whatever its role.
- Each named ADR that is `proposed` **and whose `Item` is the closing
  item**: run `pm-adr accept`. List them in the `Note` as `Accepted ADR-NNN
  <title>.` A proposed ADR the spec only follows or cites (another item's,
  or `Item: none`) is left proposed, so `proposed` keeps meaning "not yet
  built". Accepted, superseded, and deprecated ADRs are left as they are.
  (Builder's call, from the builder check: limits "the ADRs the spec names"
  to the ones this item recorded.)
- **Where the files come from.** The ADRs this item recorded are committed
  on the item's branch, not the **PM base**, so the decisions folder is not
  one of the record files read from the base. `done` changes only the
  `Status` line of each accepted ADR, in place, in the worktree that holds
  the item's branch, and commits it in the same `docs(pm): close <ID>
  <slug>` commit. Like the rest of the Completion record, this is the
  **Completion rides the branch** exception to `pm-adr`'s "write in the main
  worktree" guard; `pm-adr`'s Guard gains one line saying so.

Recorded as ADR-003 Item close accepts its spec's ADRs.

### 6. `pm-review`

- A new check in step 4 (Roadmap health), or a step between 3 and 4: list
  ADRs whose `Status` is `proposed` and whose `Date` is at least the review
  cadence (`config.md` Limits) before today.
- Imported ADRs (`Source` set) count from their own `Date` like any other:
  an old imported `proposed` ADR is genuinely undecided, so the first review
  after an import triages them (builder's call; the flood happens once).
- For each, one choice question, with the `## For this question` legend:
  `ADR-NNN <title> has been proposed since <date>. What should happen to
  it?` with `Accept it (recommended)`, `Deprecate it`, `Keep it proposed`,
  and `Explain ADR-NNN`. Recommend `Deprecate it` instead when its `Item` is
  dropped in `LOG.md`.
- Apply with `pm-adr accept` or `pm-adr deprecate` (ask the reason with two
  drafted options); `Keep it proposed` writes nothing. The review's commit
  covers them; the output names each change.

### 7. `pm-purview`

- Step 6 (Decide): for each accepted recommendation, run `pm-adr new` with
  `Status: accepted`, `Category: tooling` unless another suggested word fits
  better, `Item: none`, the decision from the recommendation, and the
  report's alternatives and challenge under `## Alternatives`.
- Before writing, read the accepted ADR titles; when one covers the same
  decision, run `pm-adr supersede` instead (no extra question: the accepted
  recommendation is the user's decision).
- The output `## Note` names each ADR written.

### 8. `pm-status`

The summary gains one line under `## Status`: `- ADRs: <n> accepted, <n>
proposed`, counted from the `Status` lines in the decisions folder. Omit it
when the folder is missing or holds no ADR. `mine` view is unchanged.

### 9. `pm-help`

Two diagnosis checks, appended to step 1's ordered list:

- **Stale proposed ADRs:** any ADR `proposed` for at least the review
  cadence. Finding: `<n> ADRs proposed since <oldest date>`. Fix:
  `pm-review`.
- **Broken ADRs:** the `pm-adr check` rules (`adr/header`, `adr/sections`,
  `adr/id`, `adr/links`), with `bun <pm-lint skill>/scripts/lint.ts check
  <PM root>/decisions --root . --no-export` when Bun is installed, else by
  reading. Finding: `<n> ADR findings`. Fix: `pm-adr check`.

Both are skipped when the decisions folder is missing. The skill guide row
for `pm-adr` is unchanged.

### 10. Docs site (AGENTS.md convention)

Nothing new. No PM state, file format, or setting changes; the Decisions
view (R-038) already lists, filters, and counts ADRs by status, and an
accepted ADR's `Item` already links it to its feature page.

### 11. Version

`main` is `21.0.0-pre.4` and `v21.0.0` is not tagged, so this skills change
stays on rules 21: `just bump prerelease` to `21.0.0-pre.5`.

## Done when

- `pm-shape` and `pm-discover` read the accepted ADR titles and challenge a
  contradiction (sections 3).
- `pm-revise` supersedes an ADR that a `rewind` or `fix-in-place` reverses
  (section 4).
- `pm-checkpoint` (`done`) stays in `pause` on a spec ADR ID with no file and
  accepts the spec's proposed ADRs (section 5).
- `pm-review` lists ADRs proposed longer than the review cadence and applies
  accept or deprecate (section 6).
- `pm-purview` records an accepted recommendation as an accepted ADR
  (section 7).
- `pm-status` shows the ADR counts line; `pm-help` reports stale proposed and
  broken ADRs (sections 8 and 9).
- `pm-next` (paused checkpoint), `pm-resume`, `pm-checkpoint` `pop`,
  `pm-revise` `rewind`, and `pm-rejoin` cite **Every design handoff** when
  they re-enter design (section 2).
- The managed section's ADR definition and Version 21 note are updated and
  installed in `AGENTS.md`; `package.json` is `21.0.0-pre.5`.
- `just validate`, `just test`, and `just lint-check` pass.

## Left to the builder

- Exact SKILL.md wording and step numbering, within the Communication
  contract and each skill's fixed output template.
- Whether `pm-review`'s ADR check is a new numbered step or part of step 4.
- How `pm-checkpoint` finds ADR IDs in the spec (a `ADR-\d{3,}` match over
  the spec file is enough).
