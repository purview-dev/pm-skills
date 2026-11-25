# ADR skill follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close R-039's five final-review minors in the PM skills' prose (R-041).

**Architecture:** Edits to `SKILL.md` prose and the managed rules section only; no script, schema, export, or docs-site change. `pm-checkpoint` (`done`) follows ADR-010 Item close names captures, accepts ADRs in place (proposed), which supersedes ADR-003.

**Tech Stack:** Markdown; `just` recipes on Bun (`scripts/validate.ts`, `markdownlint-cli2`, `pm-lint`).

**Spec:** `docs/superpowers/specs/2026-11-25-adr-skill-follow-ups-design.md`

## Global Constraints

- Branch `feat/r-041-adr-skill-follow-ups`; do not create another.
- Stays on rules 21: `package.json` moves `21.0.0-pre.9` → `21.0.0-pre.10` with `just bump prerelease`; the `version=21` marker does not change.
- A **capture** is an uncommitted inbox file, decisions-folder file, or `RISKS.md`.
- ADR-001 stands: `pm-park`, `pm-risk`, and `pm-adr` keep writing in the main worktree.
- `done` never moves or deletes files in the main worktree.
- Commit messages are conventional commits with a lowercase subject (commitlint `subject-case`).

## Review Focus

- `done` with an uncommitted `NOW.md`, `ROADMAP.md`, `LOG.md`, `STRATEGY.md`, or brief in either worktree still stops: Task 3's wording keeps that stop explicit.
- A spec-named ADR in the main worktree that is `accepted` already, or belongs to another item, is left as it is and is not an error: Task 3 says so.
- An ADR in neither place still keeps `done` in `pause` with the existing message: Task 3 keeps the line.
- `pm-purview` run by the user in `check` mode (not from a skill) still returns its answer and writes its report, with no roadmap question: Task 2 wording covers both callers.
- The managed-section copy in `AGENTS.md` drifts from the reference: Task 4 runs `just validate`, which fails on drift.

---

### Task 1: Dated Supersedes notes and legend reuse (problems 1 and 4)

**Files:**

- Modify: `skills/pm-discover/SKILL.md:86-90`
- Modify: `skills/pm-revise/SKILL.md:156-160`
- Modify: `skills/pm-shape/SKILL.md:86-91`
- Modify: `skills/pm-review/SKILL.md:81-87`

- [ ] **Step 1: Confirm the old wording is present**

Run: `rg -n "Supersedes ADR-NNN" skills/pm-discover/SKILL.md skills/pm-revise/SKILL.md; rg -n "print the .## For this question. legend" skills/pm-shape/SKILL.md skills/pm-review/SKILL.md`
Expected: matches at the lines above.

- [ ] **Step 2: Edit**

- `pm-discover` step 4 and `pm-revise` step 8: the inbox Notes line is `- <YYYY-MM-DD> Supersedes ADR-NNN <title> in design.` (today's date). Leave `pm-revise` step 6 (roadmap `Note:`) unchanged.
- `pm-shape` step 5 and `pm-review` stale proposed ADRs: "print the `## For this question` legend, unless a `## For this discussion` legend in this output already lists the ADR, and ask: …".

- [ ] **Step 3: Verify**

Run: `rg -n "<YYYY-MM-DD> Supersedes ADR" skills/pm-discover/SKILL.md skills/pm-revise/SKILL.md; rg -n "already lists the ADR" skills/pm-shape/SKILL.md skills/pm-review/SKILL.md; bunx markdownlint-cli2 skills/pm-discover/SKILL.md skills/pm-revise/SKILL.md skills/pm-shape/SKILL.md skills/pm-review/SKILL.md`
Expected: two matches each; `0 issues`.

- [ ] **Step 4: Commit**

```bash
git add skills/pm-discover/SKILL.md skills/pm-revise/SKILL.md skills/pm-shape/SKILL.md skills/pm-review/SKILL.md
git commit -m "fix(pm-skills): dated supersedes notes and adr legend reuse (R-041)"
```

### Task 2: `pm-purview` check mode stops before deciding (problem 2)

**Files:**

- Modify: `skills/pm-purview/SKILL.md:34-35` (Guard) and `:101` (step 6 head)

- [ ] **Step 1: Edit**

- Guard line: "In `check` mode, from another PM skill or the user, steps 6 and 7 do not run: step 5 writes the report and the answer returns to the caller (the calling skill's step, or the output)."
- Step 6 opens with: "In `check` mode, stop here and return the step 5 result."

- [ ] **Step 2: Verify**

Run: `rg -n "check. mode" skills/pm-purview/SKILL.md; bunx markdownlint-cli2 skills/pm-purview/SKILL.md`
Expected: the Guard and step 6 lines both name `check` mode; `0 issues`.

- [ ] **Step 3: Commit**

```bash
git add skills/pm-purview/SKILL.md
git commit -m "fix(pm-purview): check mode never decides or writes adrs (R-041)"
```

### Task 3: `pm-checkpoint` done finds main-worktree ADRs and names captures (problems 3 and 5, ADR-010)

**Files:**

- Modify: `skills/pm-checkpoint/SKILL.md:108-138` (step 5)
- Modify: `skills/pm-adr/SKILL.md:38-41` (Guard)

- [ ] **Step 1: Edit `pm-checkpoint` step 5, "The spec's ADRs"**

Look for each `ADR-NNN-*.md` in the item's branch's decisions folder, then in the main worktree's. Only an ID found in neither keeps `pause` with `ADR-NNN named in <spec> has no file.` (unchanged text). Name ADR-010.

- [ ] **Step 2: Edit "Choose the commit worktree"**

Replace the stop sentence: stop when the PM branch and its remote have diverged, or when either worktree has uncommitted PM paths other than captures (define capture as in Global Constraints). Captures in the item's worktree are swept into this commit. Captures in the main worktree, when it is another worktree, add the Note `<n> captures uncommitted on <PM branch>: <paths>. The next PM commit there carries them.`

- [ ] **Step 3: Edit "Accept the item's ADRs"**

An ADR on the item's branch is accepted there (unchanged). One found only in the main worktree, `proposed`, with `Item: <this ID>`, is accepted in place in the main worktree, with the Note `Accepted ADR-NNN <title> in the main worktree; the next PM commit on <PM branch> carries it.` Any other main-worktree ADR is left as it is. Replace "The decisions folder is not read from the **PM base**: the item's ADRs are committed on its branch." with "The decisions folder is never read from the **PM base**."

- [ ] **Step 4: Edit `pm-adr` Guard**

`accept` applied by `pm-checkpoint` (`done`) writes in the worktree that holds the item's branch, or in the main worktree when the ADR is only there (ADR-010).

- [ ] **Step 5: Verify**

Run: `rg -n "ADR-010|captures uncommitted|in the main worktree; the next PM commit" skills/pm-checkpoint/SKILL.md skills/pm-adr/SKILL.md; rg -n "has no file" skills/pm-checkpoint/SKILL.md; bunx markdownlint-cli2 skills/pm-checkpoint/SKILL.md skills/pm-adr/SKILL.md`
Expected: each phrase matches; the `has no file` line is still there; `0 issues`.

- [ ] **Step 6: Commit**

```bash
git add skills/pm-checkpoint/SKILL.md skills/pm-adr/SKILL.md
git commit -m "fix(pm-checkpoint): done names captures and finds main-worktree adrs (R-041)"
```

### Task 4: Managed rules, version, and full check

**Files:**

- Modify: `skills/pm-setup/references/AGENTS-section.md:927-929` and the Version 21 upgrade notes
- Modify: `AGENTS.md` (the installed managed section, between the markers)
- Modify: `package.json` (via `just bump prerelease`)

- [ ] **Step 1: Edit the reference**

*Completion rides the branch*, the stop bullet: the same rule as Task 3 Step 2 (stop on other uncommitted PM paths; sweep captures in the item's worktree; name captures in the main worktree). Append to the last Version 21 paragraph: "`pm-checkpoint` (`done`) no longer stops for an inbox file, risk, or ADR captured mid-workflow: it commits or names them, and accepts an item's ADR in the main worktree when it is only there (ADR-010)."

- [ ] **Step 2: Copy into `AGENTS.md`**

Replace the section between `<!-- pm-skills:start` and `<!-- pm-skills:end -->` in `AGENTS.md` with the reference's section, minus the marker's `version=21` (and the space before it).

- [ ] **Step 3: Bump**

Run: `just bump prerelease`
Expected: `package.json` version `21.0.0-pre.10`.

- [ ] **Step 4: Full check**

Run: `just lint-check` then `just version-check`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```bash
git add skills/pm-setup/references/AGENTS-section.md AGENTS.md package.json
git commit -m "fix(pm-setup): done keeps captures, version 21.0.0-pre.10 (R-041)"
```
