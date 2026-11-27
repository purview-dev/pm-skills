# Lifecycle guards rehearsal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Subagents cannot run this plan: the user drives every probe in this session.

**Goal:** Write `planning/research/2026-11-27-m3-rehearsal.md` with the evidence for the three live probes (V3a plain idea, V3b `/pm-shape`, and V2 `/clear` then resume).

**Architecture:** There is no code. The user types each probe prompt live in this Claude Code session on `feat/r-016-rehearse-the-lifecycle-guards`. The agent records the prompt, its own verbatim output, `git status --porcelain`, and the HEAD sha in the report, then sets a pass or fail result against the rule named in the spec.

**Tech Stack:** Claude Code, the `pm-*` skills linked by `just setup-skills`, `pm-lint`, `markdownlint-cli2`.

**Spec:** `docs/superpowers/specs/2026-11-27-lifecycle-guards-rehearsal-design.md`

## Global Constraints

- The rehearsal runs live in this repository, driven by the user; no scratch repository and no subagent (A6).
- The probes run in a fixed order: V3a, then V3b, then V2.
- Defects get no fixes in R-016. Each failure is named in the report and captured with `pm-bug`.
- `STRATEGY.md` gets no edits. The B3 and A6 statuses go to `pm-strategy` after R-016 closes.
- The user types prompts in their own words, not in the rules' wording.
- A probe re-runs at most once after a failure, and the report records both runs.
- ADRs: none. Principles: none (`planning/ENGINEERING.md` is missing).

## Review Focus

- The agent fails to treat inline `executing-plans` as an active workflow, so V3a's idea starts a discussion or a brief. V3a's result line states which rule-1 workflow was active.
- A plain idea that reads like an order to build something now ("we should also add X") is built instead of parked. The V3a prompt is the user's own words, and the report quotes them.
- `/pm-shape` loads the skill text directly, so the skill's own Guard, not the agent, has to stop it. V3b records which one stopped it.
- After `/clear`, auto-memory or `CLAUDE.md` content contradicts `NOW.md`. V2 checks the output against `NOW.md` field by field.
- An uncommitted inbox file from V3a is still in the tree at `/clear`. V2 records whether `pm-resume` reports it and stays read-only (`git status --porcelain` is identical before and after; no `PAUSE.md` exists).

---

### Task 1: Report skeleton and preconditions (agent)

**Files:**

- Create: `planning/research/2026-11-27-m3-rehearsal.md`
- Modify: `planning/NOW.md` (by `pm-checkpoint stage`, before this task starts)

- [ ] **Step 1: Confirm the stage.** Run `Select-String -Path planning/NOW.md -Pattern 'Stage: execute'`. Expected: one match (`pm-checkpoint stage` moved R-016 to execute when this plan was staged).
- [ ] **Step 2: Write the report header.** The header is a `# M3 rehearsal 2026-11-27` title, then `Item: R-016 Rehearse the lifecycle guards`, `Branch: feat/r-016-rehearse-the-lifecycle-guards`, `Skills commit: <git rev-parse --short HEAD>`, and `Session: live Claude Code session in this repository, driven by the user; skills from skills/ through just setup-skills`. Below it, add empty `## Probe V3a: plain idea`, `## Probe V3b: /pm-shape`, `## Probe V2: resume after /clear`, and `## Skill defects found` sections.
- [ ] **Step 3: Verify.** Run `bun skills/pm-lint/scripts/lint.ts check planning/research/2026-11-27-m3-rehearsal.md --root .` and `bunx markdownlint-cli2 planning/research/2026-11-27-m3-rehearsal.md`. Expected: `pm-lint: clean` and `0 issues`.

### Task 2: Probe V3a, plain idea (user, then agent)

- [ ] **Step 1 (user):** With this plan running, type an idea in your own words and ask to talk it through, without naming a skill.
- [ ] **Step 2 (agent):** Respond as the rules direct, with no rehearsal-aware shortcut.
- [ ] **Step 3 (agent):** Record in the report: the exact prompt, the verbatim reply, the inbox file written (path and its `Discuss:` line), `git status --porcelain`, whether a follow-up question was asked, and whether the plan step resumed. Set `Result: pass` when exactly one inbox file with `Discuss: yes` was written, the reply was one line, and no question was asked (rules 3 and 5). Otherwise set `Result: fail (<rule>)`.

### Task 3: Probe V3b, `/pm-shape` (user, then agent)

- [ ] **Step 1 (user):** Type `/pm-shape <an idea in your words>`.
- [ ] **Step 2 (agent):** Respond as the rules direct.
- [ ] **Step 3 (user):** If the rule-4 question appears, pick `After <skill> finishes (recommended)`.
- [ ] **Step 4 (agent):** Record the prompt, the verbatim output, the question and its options, the option picked, whether the idea was parked (inbox path or `not parked`), what stopped `pm-shape` (its Guard or the agent), and `git status --porcelain`. Set `Result: pass` when `pm-shape` wrote no brief and the rule-4 question had both options. Then add a line that compares the Done when's "parking" with rule 4's "ask".

### Task 4: Probe V2, resume after `/clear` (agent, user, then agent)

- [ ] **Step 1 (agent):** Run `pm-checkpoint pause`, with `Next action: Record the pm-resume output under "Probe V2" in planning/research/2026-11-27-m3-rehearsal.md (plan Task 4, Step 4)`. Record the commit sha in the report.
- [ ] **Step 2 (user):** Run `/clear`.
- [ ] **Step 3 (user):** Ask where work stopped, as `/pm-resume` or in plain words.
- [ ] **Step 4 (agent, new context):** Record the prompt, the verbatim output, `git status --porcelain` before and after, and a field check against `planning/NOW.md` (Item, Stage, Next action). Set `Result: pass` when the output names `R-016 Rehearse the lifecycle guards`, `execute`, and the checkpoint's `Next action`, contradicts no `NOW.md` field, and writes nothing.

### Task 5: Defects, verification, and commit (agent)

- [ ] **Step 1:** For each `fail` result, run `pm-bug` (capture) with the probe's evidence, and list `<probe>: <rule broken>, <inbox file>` under `## Skill defects found`. Write `none` when nothing failed.
- [ ] **Step 2: Verify.** Run `bun skills/pm-lint/scripts/lint.ts check planning/ --root .` and `bunx markdownlint-cli2 planning/research/2026-11-27-m3-rehearsal.md`. Expected: `pm-lint: clean` and `0 issues`.
- [ ] **Step 3: Done when check.** Check that the report has V2 and V3a (or V3b) sections with verbatim output and a result line.
- [ ] **Step 4: Commit.** Run `git add planning/` and `git commit -m "docs(pm): R-016 lifecycle guards rehearsal report"`.
