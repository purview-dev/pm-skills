# Plan citation and done check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plan handoff name the ADRs and principles that apply, make `pm-checkpoint` (`done`) check changed files against the principles, and record an accepted Purview package in `ENGINEERING.md` when its item closes.

**Architecture:** Prose only (ADR-013 Principles are matched and checked in prose): a new **Every plan handoff** shared definition in the managed section, cited by every skill that enters the plan stage; a principles check and a Purview record step in `pm-checkpoint` (`done`); a `Purview package:` marker in `pm-purview`. A `scripts/validate.ts` guard pins the citations. A rehearsal in a fresh agent session proves the behaviour.

**Tech Stack:** Markdown skills, Bun scripts (`scripts/validate.ts`), just, markdownlint-cli2.

**Spec:** `docs/superpowers/specs/2026-11-25-plan-citation-and-done-check-design.md`

## Global Constraints

- Managed-rule text changes only in `skills/pm-setup/references/AGENTS-section.md`; then replace the section between the markers in `AGENTS.md` with the reference minus the marker's `version=` (AGENTS.md, Repository conventions).
- Rules stay at version 21: the line is `21.0.0-pre.12`, `v21.0.0` is not tagged. Run `just bump prerelease` once (Task 4).
- No script, no `pm-lint` rule, no export or docs-site change (spec Non-goals).
- A refused close writes nothing (spec Anti-goals); a review finding never blocks; `ENGINEERING.md` never lists a package before it is in a manifest.
- Skills reference shared definitions; they do not restate them (AGENTS.md: skills must not redefine them).
- Commit subjects are lowercase (commitlint `subject-case`), for example `feat(pm-checkpoint): check principles at done (R-036)`.
- `just lint-check` passes at the end of every task that touches `skills/` (it runs `validate`, `test`, `pm-lint`, `package-test`); between tasks `just validate` and `bunx markdownlint-cli2 <changed files>` are enough.

## Review Focus

1. **Deleted files in the diff.** `git diff --name-only` lists deleted paths; reviewing or matching a deleted file is wrong. Use `git diff --name-only --diff-filter=d <PM base>...HEAD`. Pinned in Task 2 text, exercised in Task 5 step 4.
2. **A command check that cannot run** (tool not installed, exit 127, or a bash command in PowerShell). Treat it as a failure that blocks, with the message, and run commands in the shell the session uses. Pinned in Task 2, exercised in Task 5 step 4.
3. **Spec with no paths / no `ENGINEERING.md`.** The handoff must still print `Principles: none` (or only `all` principles), never skip the line. Pinned in Task 1, exercised in Task 5 step 3.
4. **Central package versions.** A Purview package whose version lives in `Directory.Packages.props`, not the `.csproj`. Version comes from wherever `PackageVersion` is set. Pinned in Task 3, exercised in Task 5 step 5.
5. **Package already recorded.** An existing `### <Name>` entry gets `Version` changed, never a duplicate block. Pinned in Task 3.

---

### Task 1: Every plan handoff

**Files:**

- Modify: `scripts/validate.ts:59-64` (guard)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (after **Every design handoff**, line ~300)
- Modify: `skills/pm-checkpoint/SKILL.md` step 3 (`stage`) and step 8 (`pop`)
- Modify: `skills/pm-next/SKILL.md:154` (Paused checkpoint paragraph)
- Modify: `skills/pm-resume/SKILL.md` step 6 (next action bullets, beside the design `ADRs:` bullet)
- Modify: `skills/pm-rejoin/SKILL.md` step 7
- Modify: `skills/pm-revise/SKILL.md` step 10
- Modify: `AGENTS.md` (reinstalled section)

**Interfaces:**

- Produces: the definition name `**Every plan handoff**` and the handoff block format, used by Task 5:

  ```markdown
  - ADRs: <ADR-NNN <title> (<status>), ... | none>
  - Principles: <EP-NNN <title>: <Rule> (Check: <command | review>); ... | none>
  - Cite the EP and ADR IDs in the tasks they constrain; put each command check in the plan's verification steps.
  ```

- [ ] **Step 1: Add the failing guard.** In `scripts/validate.ts`, after the design loop, add the same loop over `["pm-next", "pm-checkpoint", "pm-revise", "pm-rejoin", "pm-resume"]` requiring `**Every plan handoff**`, failing with `skills/${name}/SKILL.md: a plan re-entry does not cite **Every plan handoff**`. Also fail when `AGENTS-section.md` lacks `- **Every plan handoff**`. Comment: `// Every way into plan passes the principles and ADRs (R-036).`
- [ ] **Step 2: Run `just validate`.** Expected: FAIL with six `Every plan handoff` lines.
- [ ] **Step 3: Write the definition** in `AGENTS-section.md` after **Every design handoff**, as the spec's Design section 1 states it: the entry points, the ADRs the spec names (named references with status, or `none`), the principles whose `Applies to` is `all` or matches a path or glob the spec names (a missing `ENGINEERING.md` is `none`; a spec naming no paths gets only `all` principles, and says so), the format above, and the instruction to the plan stage. Cite ADR-013.
- [ ] **Step 4: Cite it at each call site**, one sentence each, mirroring the existing design sentence beside it: `pm-checkpoint` step 3 (when the next stage is `plan`) and step 8 (restored `Stage` is `plan`); `pm-next` Paused checkpoint paragraph (stage `plan`); `pm-resume` step 6 (next action starts the `plan` skill: add the `ADRs:` and `Principles:` bullets, read-only); `pm-rejoin` step 7; `pm-revise` step 10 (`rewind` to plan).
- [ ] **Step 5: Reinstall the section** into `AGENTS.md` (replace between the markers with the reference minus `version=`).
- [ ] **Step 6: Run `just validate` and `bunx markdownlint-cli2 AGENTS.md skills/**/SKILL.md skills/pm-setup/references/AGENTS-section.md`.** Expected: PASS, 0 errors.
- [ ] **Step 7: Commit**

```bash
git add scripts/validate.ts AGENTS.md skills/pm-setup/references/AGENTS-section.md skills/pm-checkpoint/SKILL.md skills/pm-next/SKILL.md skills/pm-resume/SKILL.md skills/pm-rejoin/SKILL.md skills/pm-revise/SKILL.md
git commit -m "feat(pm-skills): pass principles and adrs to every plan handoff (R-036)"
```

### Task 2: Principles check at done

**Files:**

- Modify: `scripts/validate.ts` (guard)
- Modify: `skills/pm-checkpoint/SKILL.md` step 5 (new sub-step after the spec's ADR check, before **Check before writing**; output template Note)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (**Completion record** definition: the close checks the principles first), `AGENTS.md`

**Interfaces:**

- Consumes: `**Every plan handoff**` matching wording from Task 1 (same `all` / glob rule).
- Produces: the sub-step heading `**Principles check**` (ADR-013) and these exact lines, used by Task 5:
  - block: `EP-NNN <title>: <command> failed (exit <n>).` plus the last 20 lines of output
  - review: Note `EP-NNN <title>: <file> <finding>` and a `pm-park` (`agent`) inbox file with `Kind: tech-debt`, `Affects: <ID>`, `Source: agent (<ID> done)`
  - summary Note: `Principles: <n> command checks passed, <m> review findings.` or `Principles: none apply.`

- [ ] **Step 1: Add the failing guard:** `skills/pm-checkpoint/SKILL.md` must contain `**Principles check**` and `--diff-filter=d`; fail with `skills/pm-checkpoint/SKILL.md: done has no **Principles check**`.
- [ ] **Step 2: Run `just validate`.** Expected: FAIL on that line.
- [ ] **Step 3: Write the sub-step** per spec Design section 2: changed files from `git diff --name-only --diff-filter=d <PM base>...HEAD` in the item's worktree, outside the PM root; `ENGINEERING.md` from the **PM base**; run every matching command check in the item's worktree, in the shell the session uses, before stopping; a non-zero exit, including a command that cannot run, keeps `done` in `pause` with nothing written; review checks never block; review findings are captures (ADR-010). Add the summary Note to the output template's Note list.
- [ ] **Step 4: Update the Completion record definition** in `AGENTS-section.md` with one clause: `pm-checkpoint` (`done`) runs the principles check first and writes nothing when a command check fails. Reinstall into `AGENTS.md`.
- [ ] **Step 5: Run `just validate` and markdownlint on the changed files.** Expected: PASS.
- [ ] **Step 6: Commit** `feat(pm-checkpoint): check principles before the completion record (R-036)`.

### Task 3: Purview packages recorded at close

**Files:**

- Modify: `skills/pm-purview/SKILL.md:112-116` (step 6, the item's `Note:`)
- Modify: `skills/pm-checkpoint/SKILL.md` step 5 (after **Accept the item's ADRs**; the PM-base read list in **Choose the commit worktree**; **Check before writing** treats `ENGINEERING.md` like `ROADMAP.md`)
- Modify: `skills/pm-engineering/SKILL.md` Guard (the during-workflow bullet)
- Modify: `skills/pm-setup/references/AGENTS-section.md` (**Completion record** writes, and **Completion rides the branch** read list gain `ENGINEERING.md`), `AGENTS.md`
- Modify: `scripts/validate.ts` (guard)

**Interfaces:**

- Produces: marker `Purview package: <PackageId>.` in the item `Note` (written by `pm-purview`, read by `done`), sub-step `**Record the Purview package**` (ADR-014), Notes `Recorded <PackageId> <version> in ENGINEERING.md.` and `Purview package <PackageId> is not in a manifest; not recorded.`

- [ ] **Step 1: Add the failing guard:** `skills/pm-purview/SKILL.md` contains `Purview package: <PackageId>.` and `skills/pm-checkpoint/SKILL.md` contains `**Record the Purview package**`.
- [ ] **Step 2: Run `just validate`.** Expected: FAIL on both.
- [ ] **Step 3: `pm-purview` step 6:** the item `Note:` starts with `Purview package: <PackageId>.`, then the docs URL and report path. State that nothing is written to `ENGINEERING.md` here (ADR-014).
- [ ] **Step 4: `pm-checkpoint` done sub-step** per spec Design section 3: manifests searched are `*.csproj`, `Directory.Packages.props`, `Directory.Build.props`, `global.json` on the item's branch; `Version` from the `PackageReference` or the central `PackageVersion`; field values exactly as the spec lists, including the `Reason` fallback `Adopted through <ID> <title> (pm-purview).`; an existing `### <Name>` entry gets only `Version` changed; it applies `pm-engineering` `add technology` write steps only (no question, output, or commit). Add `ENGINEERING.md` to the files read from the **PM base** and to the uncommitted PM paths that stop `done`.
- [ ] **Step 5: `pm-engineering` Guard:** after "only `view` runs", add that `pm-checkpoint` (`done`) applies the `add technology` write steps for a Purview package (ADR-014), as `pm-adr` names `accept`.
- [ ] **Step 6: Managed section:** add `ENGINEERING.md` (a Purview package entry) to the **Completion record** list and to the **Completion rides the branch** read list. Reinstall into `AGENTS.md`.
- [ ] **Step 7: Run `just validate` and markdownlint.** Expected: PASS.
- [ ] **Step 8: Commit** `feat(pm-checkpoint,pm-purview): record purview packages at item close (R-036)`.

### Task 4: Upgrade note, help, and version

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md` (append a `Version 21 also ...` paragraph after line ~1133), `AGENTS.md`
- Modify: `skills/pm-help/SKILL.md:54` (`pm-checkpoint` row Reads/Writes column adds `ENGINEERING.md`)
- Modify: `package.json` (via `just bump prerelease`)

- [ ] **Step 1: Upgrade note:** `Version 21 also passes the ADRs the spec names and the principles that apply to its files to every plan handoff, has pm-checkpoint (done) run the principles' command checks before it closes an item (a failure blocks; a review finding is a Note and an inbox file), and records a package pm-purview accepted in ENGINEERING.md when its item closes. No setting is added.` Reinstall into `AGENTS.md`.
- [ ] **Step 2: pm-help row** for `pm-checkpoint`: add `ENGINEERING.md` to its files column.
- [ ] **Step 3: Run `just bump prerelease`.** Expected: `package.json` is `21.0.0-pre.13`.
- [ ] **Step 4: Run `just lint-check` and `just version-check`.** Expected: PASS.
- [ ] **Step 5: Commit** `chore(release): 21.0.0-pre.13 plan citation and done check (R-036)`.

### Task 5: Rehearsal in a fresh session

**Files:**

- Create: `planning/research/2026-11-26-m4-rehearsal.md` (format of `planning/research/2026-11-24-context-baseline.md`)

Run by one fresh subagent (Agent tool, general-purpose) whose prompt is the spec's section 5 plus this task; it reports commands and output excerpts, and the main session writes the report. The scratch repository is a new empty temp directory outside this repository.

- [ ] **Step 1: Scratch repo.** `git init`; `package.json`; `App.csproj` with `<PackageReference Include="Purview.Telemetry.SourceGenerator" />` and `Directory.Packages.props` holding its `PackageVersion` (Review Focus 4); `docs/adr/0001-use-bun.md`, `docs/adr/0002-typescript-only.md` (MADR); `src/index.ts`. Install this branch's skills with links as `just setup-skills` makes (or `bunx skills add <this repo> -y`). Commit.
- [ ] **Step 2: Init and import.** Run `pm-init`, then `pm-adr import docs/adr/`. Expected: two ADR files in `planning/decisions/`.
- [ ] **Step 3: Plan handoff.** First, with no `ENGINEERING.md`, `pm-checkpoint stage` after a design prints `Principles: none` (Review Focus 3). Then `pm-engineering add principle`: EP-001 `No JavaScript in src`, `Applies to: src/**`, `Check:` a command that exits non-zero when `src/` has a `.js` file; EP-002 `Errors carry context`, `Applies to: src/**`, `Check: review`. Claim an item, write a spec naming `src/index.ts` and an imported ADR, run `pm-checkpoint stage`. Expected: handoff lists EP-001, EP-002, and the ADR. Run the real `superpowers:writing-plans`; record whether its tasks cite the IDs (assumption A5).
- [ ] **Step 4: Done check.** Add `src/a.js`, a change in `src/index.ts` that throws a bare `Error()`, and delete one other `src/` file. `pm-checkpoint done`: expected refusal naming EP-001, and `git status` shows no PM write. Remove `src/a.js`; `done` closes with Note `EP-002 Errors carry context: src/index.ts ...`, an inbox file with `Kind: tech-debt`, and no line about the deleted file (Review Focus 1). Record also a run with a check command that is not installed: expected refusal (Review Focus 2).
- [ ] **Step 5: Purview record.** An item whose `Note` starts `Purview package: Purview.Telemetry.SourceGenerator.`, a proposed ADR with `Item` that ID, closed with `done`. Expected: `ENGINEERING.md` gains `### Purview.Telemetry.SourceGenerator` with `Version` from `Directory.Packages.props`, `Source` that path, `Decision` the ADR; `pm-lint check` clean.
- [ ] **Step 6: Write the report** with one section per step (commands, output excerpts, pass or fail), the A5 finding, and the scratch repo's location; run `just pm-lint`. Expected: clean.
- [ ] **Step 7: Fix and re-run** any step that failed, by editing the skill text in the owning task's files, then re-run that step in a fresh session. Record each re-run in the report.
- [ ] **Step 8: Commit** the report as a PM path through the normal PM commit, or with `git add planning/research/2026-11-26-m4-rehearsal.md` and `docs(pm): m4 rehearsal report (R-036)`; then `just lint-check`. Expected: PASS.
