# R-039 ADRs across the PM skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every PM skill that meets a technical decision read, respect, or update the ADRs in `planning/decisions/`, always through `pm-adr`.

**Architecture:** One step in each affected `skills/pm-*/SKILL.md`, at the point the skill acts, citing the managed section's Shared definitions (**Every design handoff**, **ADR**, **Read before deciding**) instead of restating them. ADR writes apply a `pm-adr` mode's write steps without its output or commit (spec section 0). One `scripts/validate.ts` guard pins the design re-entries.

**Tech Stack:** Markdown skills, Bun + TypeScript (`scripts/validate.ts`), `just`, markdownlint-cli2.

**Spec:** `docs/superpowers/specs/2026-11-22-adrs-across-the-pm-skills-design.md`

## Global Constraints

- ADR files are written only through `pm-adr` modes (Shared definitions: ADR). No skill restates a shared definition; cite it by name.
- During a workflow, ADR writes never ask, reply in one line, and never commit on their own (spec, Anti-goals).
- Named references everywhere: `ADR-NNN <title> (<status>)`, `R-NNN <title>` (Communication contract).
- Each skill keeps its fixed output template; add lines only inside existing sections.
- Rules stay on version 21: `package.json` becomes `21.0.0-pre.5` (`just bump prerelease`). The marker in `skills/pm-setup/references/AGENTS-section.md` stays `version=21`.
- Commit subjects are conventional and lower-case after the scope (commitlint rejects a subject starting `R-039`): e.g. `feat(pm-checkpoint): accept the spec's adrs at done`.
- Every commit passes `bunx markdownlint-cli2` on the files it changes.

## Review Focus

- A spec that names no ADR, or an item with no `Spec`: `done` must close normally with no ADR line in the Note (Task 4 wording states it).
- A missing `planning/decisions/` folder: `pm-shape`, `pm-discover`, `pm-review`, `pm-status`, `pm-help`, `pm-purview` treat it as no ADRs and print nothing about them (Tasks 2, 5, 6 each state it).
- A spec that cites another item's proposed ADR: `done` leaves it `proposed` (Task 4, `Item` match only).
- `pm-revise` scope answer that reverses a decision but states no replacement: name the ADR in `## Revisions`, supersede nothing (Task 3).
- `pm-resume` stays read-only when listing ADRs for a design re-entry (Task 1 wording: list, never invoke or write).

---

### Task 1: Design re-entries pass the ADR instruction

**Files:**

- Modify: `scripts/validate.ts` (new check, after the skills-table loop near line 57)
- Modify: `skills/pm-next/SKILL.md` (the `Paused checkpoint` paragraph after step 10, ~line 143)
- Modify: `skills/pm-checkpoint/SKILL.md` (step 8 `pop`, ~line 214-231)
- Modify: `skills/pm-revise/SKILL.md` (step 5 `rewind` hand off ~line 123, step 10 ~line 142)
- Modify: `skills/pm-rejoin/SKILL.md` (step 7 Hand off, ~line 153)
- Modify: `skills/pm-resume/SKILL.md` (the step that builds `Do this next`, and the `## Do this next` template)

**Interfaces:**

- Produces: the literal phrase `**Every design handoff**` in each of the six skills; later tasks do not depend on it.

- [ ] **Step 1: Write the failing check** in `scripts/validate.ts`:

```ts
// Every way back into design passes the ADR instruction (R-039).
for (const name of ["pm-next", "pm-checkpoint", "pm-revise", "pm-rejoin", "pm-resume"]) {
 if (!read("skills", name, "SKILL.md").includes("**Every design handoff**")) {
  fail(`skills/${name}/SKILL.md: a design re-entry does not cite **Every design handoff**`);
 }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `just validate`
Expected: FAIL listing all five skills (`pm-next` step 10 currently spells the instruction out without the phrase).

- [ ] **Step 3: Add the citation to each skill**
  - `pm-next`: step 10 keeps its text and ends `(Shared definitions: **Every design handoff**)`; the `Paused checkpoint` paragraph adds: when the recorded stage is `design`, pass step 10's ADR instruction.
  - `pm-checkpoint` step 8: when the restored `Stage` is `design`, the handoff applies **Every design handoff** (Shared definitions).
  - `pm-revise`: `rewind` to `design` and step 10 apply **Every design handoff** when the stage is `design`.
  - `pm-rejoin` step 7: same condition and citation.
  - `pm-resume`: when `NOW.md` (or the matching pause) is at `Stage: design`, `Do this next` lists the accepted and proposed ADRs as named references, or `ADRs: none`, and says the design skill reads the ones its decision touches first (**Every design handoff**). It only lists; it never invokes the design skill or writes.

- [ ] **Step 4: Run to verify it passes**

Run: `just validate` then `bunx markdownlint-cli2 skills/pm-next/SKILL.md skills/pm-checkpoint/SKILL.md skills/pm-revise/SKILL.md skills/pm-rejoin/SKILL.md skills/pm-resume/SKILL.md`
Expected: validate passes; markdownlint 0 errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate.ts skills/pm-next/SKILL.md skills/pm-checkpoint/SKILL.md skills/pm-revise/SKILL.md skills/pm-rejoin/SKILL.md skills/pm-resume/SKILL.md
git commit -m "feat(pm-skills): every design re-entry passes the adr instruction"
```

### Task 2: `pm-shape` and `pm-discover` challenge ADR contradictions

**Files:**

- Modify: `skills/pm-shape/SKILL.md` (step 2 ~line 46, step 5 ~line 75, step 9 Apply the decision ~line 102)
- Modify: `skills/pm-discover/SKILL.md` (step 3 ~line 53, step 4 ~line 72, report template `## Roadmap challenges` or `## Findings`)

**Interfaces:** none produced.

- [ ] **Step 1: Write the check** — run `rg -n "Read before deciding" skills/pm-shape/SKILL.md skills/pm-discover/SKILL.md`; Expected now: no matches.
- [ ] **Step 2: Edit `pm-shape`**
  - Step 2: also read the accepted ADR titles in the decisions folder (Shared definitions: **Read before deciding**); a missing folder means none.
  - Step 5: when the idea or proposal contradicts an accepted ADR, print the `## For this question` legend and ask: `ADR-NNN <title> (accepted) says <X>; this idea needs <Y>. How should we continue?` with `Change the idea (recommended)`, `Keep it; design supersedes ADR-NNN`, and `Explain ADR-NNN`. Record challenge, answer, and reason in `## Challenges and answers`.
  - Step 9: on `Keep it`, the brief's `## Decision` line names `Supersedes ADR-NNN <title> in design`. `pm-shape` never runs `pm-adr`.
- [ ] **Step 3: Edit `pm-discover`**
  - Step 3: accepted ADR titles are an evidence source, read always (not a scope choice); missing folder means none.
  - Step 4: a finding or opportunity that contradicts an accepted ADR states it as a challenge with evidence, recorded in the report; an opportunity parked in step 7 carries `Supersedes ADR-NNN <title> in design` in its inbox file's `## Notes`. `pm-discover` never runs `pm-adr`.
- [ ] **Step 4: Verify** — `rg -n "Read before deciding" skills/pm-shape/SKILL.md skills/pm-discover/SKILL.md` shows one match each; `bunx markdownlint-cli2 skills/pm-shape/SKILL.md skills/pm-discover/SKILL.md` 0 errors.
- [ ] **Step 5: Commit** — `git commit -m "feat(pm-shape): read adrs and challenge contradictions in shape and discover"` with both files.

### Task 3: `pm-revise` supersedes a reversed ADR

**Files:**

- Modify: `skills/pm-revise/SKILL.md` (step 2 Inspect ~line 57, step 5 ~line 101, step 6 ~line 125, step 8 ~line 138, Output `## Revision` / `## Note`)

**Interfaces:**

- Consumes: spec section 0 calling rule (write steps only, no `pm-adr` output or commit).

- [ ] **Step 1: Check** — `rg -n "pm-adr supersede" skills/pm-revise/SKILL.md`; Expected: no matches.
- [ ] **Step 2: Edit**
  - Step 2: read the ADR IDs the item's spec names and the ADRs whose `Item` is the target item.
  - Step 5 (`rewind`, `fix-in-place`): when the scope answer reverses the decision of one of them (accepted or proposed) and states the new decision, apply `pm-adr supersede <ADR-NNN>` (write steps only, `Item` the active item), and name the new ADR in the brief's `## Revisions` line and the output. When the scope answer states no new decision, name the reversed ADR in the `## Revisions` line only.
  - Steps 6 (`new item`) and 8 (`park`): write `Supersedes ADR-NNN <title> in design` into the new item's `Note` or the inbox file's `## Notes`; supersede nothing.
  - Output: add `- ADR: <ADR-NNN <title> superseded by ADR-NNN <title> | none>` inside `## Revision`; omit when none.
  - No new question.
- [ ] **Step 3: Verify** — the `rg` above matches; markdownlint 0 errors.
- [ ] **Step 4: Commit** — `git commit -m "feat(pm-revise): supersede an adr the correction reverses"`.

### Task 4: `pm-checkpoint` (`done`) checks and accepts the spec's ADRs

**Files:**

- Modify: `skills/pm-checkpoint/SKILL.md` (step 5, between the plan-box check ~line 107 and "Choose the commit worktree")
- Modify: `skills/pm-adr/SKILL.md` (Guard, the "Write in the main worktree" line ~38)

**Interfaces:**

- Consumes: ADR-003 Item close accepts its spec's ADRs.

- [ ] **Step 1: Check** — `rg -n "has no file" skills/pm-checkpoint/SKILL.md`; Expected: no matches.
- [ ] **Step 2: Edit `pm-checkpoint` step 5**, adding after the plan-box check:
  - Read every `ADR-\d{3,}` ID in the file named by `Spec` in `NOW.md`. No `Spec`, or no IDs: skip this check and write no ADR Note.
  - An ID with no `ADR-NNN-*.md` file in the item branch's decisions folder: stay in `pause` and list `ADR-NNN named in <spec> has no file.`
  - Each named ADR with `Status: proposed` and `Item:` equal to the closing ID: apply `pm-adr accept` (write steps only), changing only its `Status` line, in the worktree that holds the item's branch. Others are left as they are.
  - The decisions folder is not read from the **PM base**; the accepted files ride the `docs(pm): close <ID> <slug>` commit.
  - Note line: `Accepted ADR-NNN <title>.` per ADR.
- [ ] **Step 3: Edit `pm-adr` Guard**: append to the main-worktree line: except `accept` applied by `pm-checkpoint` (`done`), which writes in the worktree that holds the item's branch (rules: **Completion rides the branch**).
- [ ] **Step 4: Verify** — the `rg` matches; `bunx markdownlint-cli2 skills/pm-checkpoint/SKILL.md skills/pm-adr/SKILL.md` 0 errors.
- [ ] **Step 5: Commit** — `git commit -m "feat(pm-checkpoint): check and accept the spec's adrs at done"`.

### Task 5: `pm-review` and `pm-help` find stale and broken ADRs

**Files:**

- Modify: `skills/pm-review/SKILL.md` (new step after step 3 or a check in step 4 ~line 64; Output `## Review` section)
- Modify: `skills/pm-help/SKILL.md` (step 1 Diagnose list ~line 92-125)

**Interfaces:**

- Produces: the definition "stale proposed ADR" = `Status: proposed` and `Date` at least the review cadence (`config.md` Limits) before today, imported ADRs (`Source` set) included. Both skills use these exact words.

- [ ] **Step 1: Check** — `rg -n "proposed" skills/pm-review/SKILL.md skills/pm-help/SKILL.md`; Expected: no ADR-related match.
- [ ] **Step 2: Edit `pm-review`**: list stale proposed ADRs (missing folder: skip). For each, print the legend and ask `ADR-NNN <title> has been proposed since <date>. What should happen to it?` with `Accept it (recommended)`, `Deprecate it`, `Keep it proposed`, `Explain ADR-NNN`; recommend `Deprecate it` instead when its `Item` is in `## Dropped` in `LOG.md`. Apply with `pm-adr accept` or `pm-adr deprecate` (write steps only; ask the deprecate reason with two drafted options). The review's single commit covers them; the output lists `ADR-NNN <title>: proposed -> <status>`.
- [ ] **Step 3: Edit `pm-help`**: append two checks to the ordered list, skipped when the decisions folder is missing:
  - `Stale proposed ADRs`: finding `<n> ADRs proposed since <oldest date>`, fix `pm-review`.
  - `Broken ADRs`: `bun <pm-lint skill>/scripts/lint.ts check <PM root>/decisions --root . --no-export` when Bun is installed, else read for the `adr/*` rules; finding `<n> ADR findings`, fix `pm-adr check`.
- [ ] **Step 4: Verify** — `bun skills/pm-lint/scripts/lint.ts check planning/decisions --root . --no-export` prints `pm-lint: clean` (proves the command the skill names works); markdownlint 0 errors on both files.
- [ ] **Step 5: Commit** — `git commit -m "feat(pm-review): triage stale proposed adrs; pm-help diagnoses them"`.

### Task 6: `pm-purview` records ADRs; `pm-status` counts them

**Files:**

- Modify: `skills/pm-purview/SKILL.md` (step 6 Decide ~line 101, Output `## Note`)
- Modify: `skills/pm-status/SKILL.md` (Steps, and the `## Status` template ~line 48-56)

- [ ] **Step 1: Check** — `rg -n "ADR" skills/pm-purview/SKILL.md skills/pm-status/SKILL.md`; Expected: no matches.
- [ ] **Step 2: Edit `pm-purview` step 6**: for each accepted recommendation, read the accepted ADR titles; when one covers the same decision apply `pm-adr supersede`, else `pm-adr new` with `Status: accepted`, `Category: tooling` unless another suggested word fits, `Item: none`, the recommendation as the decision and the report's alternatives and challenge under `## Alternatives` (write steps only, no extra question). `## Note` gains `Recorded ADR-NNN <title> (accepted).` per ADR.
- [ ] **Step 3: Edit `pm-status`**: summary `## Status` gains `- ADRs: <n> accepted, <n> proposed` after `Stack`, counted from the `Status:` lines of `<PM root>/decisions/ADR-*.md`; omit the line when the folder is missing or has no ADR. `mine` is unchanged.
- [ ] **Step 4: Verify** — the `rg` matches in both; markdownlint 0 errors.
- [ ] **Step 5: Commit** — `git commit -m "feat(pm-purview): record accepted recommendations as adrs; pm-status counts adrs"`.

### Task 7: Managed section, install, and version

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md` (Shared definitions **ADR** entry; Version 21 upgrade notes)
- Modify: `AGENTS.md` (the installed section between the markers)
- Modify: `package.json` (via `just bump prerelease`)

- [ ] **Step 1: Edit the reference**
  - **ADR** entry: append `pm-checkpoint` (`done`) accepts the proposed ADRs whose `Item` is the closing item and that its spec names, so `proposed` means a decision not yet built.
  - Version 21 notes: append a paragraph: the PM skills now read ADRs (`pm-shape`, `pm-discover`), change them through `pm-adr` (`pm-revise`, `pm-review`, `pm-purview`, `pm-checkpoint` `done`), report them (`pm-status`, `pm-help`), and every re-entry into design passes the ADR instruction. No setting is added.
- [ ] **Step 2: Install** — replace the section between the markers in `AGENTS.md` with the reference body (the start marker without `version=`).
- [ ] **Step 3: Bump** — `just bump prerelease`; Expected: `package.json` `"version": "21.0.0-pre.5"`.
- [ ] **Step 4: Verify** — `just validate`, `just test`, `just lint-check`, `just version-check`; Expected: all pass.
- [ ] **Step 5: Commit** — `git add skills/pm-setup/references/AGENTS-section.md AGENTS.md package.json` then `git commit -m "feat(pm-setup): adrs across the pm skills in the rules; 21.0.0-pre.5"`.
