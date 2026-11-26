# pm-setup Skill Count Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `just validate` fails when a `<N> of <N>` skill count in `skills/pm-setup/SKILL.md` differs from the shipped skills minus `pm-setup`.

**Architecture:** A pure helper, `skillCountDrift`, in `scripts/skill-counts.ts` (the pattern of `scripts/package-docs.ts` and its test) returns the error messages; `scripts/validate.ts` calls it after the shipped-skill loop and feeds each message to `fail`.

**Tech Stack:** TypeScript on Bun, `bun:test`.

**Spec:** `docs/superpowers/specs/2026-11-26-r-006-pm-setup-skill-counts-design.md`

## Global Constraints

- Expected count is `shipped.filter((name) => name !== "pm-setup").length` (26 today); `shipped` is the existing list in `validate.ts` (skills without `metadata.internal: true`).
- Only digit counts match: `/(\d+) of (\d+)/g`. The `Workflow skills: <n> of <total>` line must not match.
- No file under `skills/` changes (no rules bump). ADRs: none. Principles: none.

## Review Focus

- Both numbers in one match (`<26 of 26`): each is checked separately, so `25 of 26` fails once, naming 25.
- A count line reworded away: zero matches fails, so the check cannot switch off silently.
- Line numbers in messages are 1-based and count CRLF files correctly (split on `\n`).
- The real file passes: `just validate` stays green on the unchanged repository.

---

### Task 1: Skill count check

**Files:**

- Create: `scripts/skill-counts.ts`
- Create: `scripts/skill-counts.test.ts`
- Modify: `scripts/validate.ts` (after the shipped-skill loop, line 57)
- Modify: `AGENTS.md` (the `Validate only` bullet in *Build, test, and lint*)

**Interfaces:**

- Produces: `export function skillCountDrift(file: string, text: string, expected: number): string[]`

- [ ] **Step 1: Write the failing tests** in `scripts/skill-counts.test.ts` (`describe("pm-setup skill counts")`):
  - `"reports nothing when every count matches"`: text `"- Skills: <n> of 26 installed.\n- Skills: <26 of 26 installed | missing: names>\n- Workflow skills: <n> of <total> installed."`, expected 26 → `[]`.
  - `"names the line and the wrong number"`: text `"a\n- Skills: <25 of 26 installed>"`, expected 26 → `["pm-setup/SKILL.md:2: skill count 25, expected 26"]` (file argument `"pm-setup/SKILL.md"`).
  - `"reports each wrong number"`: text `"<27 of 27"`, expected 26 → two messages, both `pm-setup/SKILL.md:1: skill count 27, expected 26`.
  - `"fails when no count is found"`: text `"- Workflow skills: <n> of <total>"` → `['pm-setup/SKILL.md: no "<N> of <N>" skill count found']`.
  - `"counts lines in CRLF text"`: text `"a\r\n<25 of 26"` → message names line 2.

- [ ] **Step 2: Run to verify failure**
  Run: `bun test scripts/skill-counts.test.ts`
  Expected: FAIL (module `./skill-counts.ts` not found).

- [ ] **Step 3: Implement `skillCountDrift`** in `scripts/skill-counts.ts`: split on `\n`, match `/(\d+) of (\d+)/g` per line, push `<file>:<line>: skill count <N>, expected <expected>` for each number not equal to `expected`; when no line matched, return the single "no count found" message. Add a one-line comment saying the inventory omits `pm-setup` itself.

- [ ] **Step 4: Run to verify pass**
  Run: `bun test scripts/skill-counts.test.ts`
  Expected: 5 pass, 0 fail.

- [ ] **Step 5: Wire into `validate.ts`**: import `skillCountDrift`; after the shipped loop, `for (const message of skillCountDrift("pm-setup/SKILL.md", setup, shipped.filter((name) => name !== "pm-setup").length)) fail(message);`

- [ ] **Step 6: Verify `just validate` passes on the real file**
  Run: `just validate`
  Expected: exit 0, `validate: 27 skills OK, 1 repo-local (release)`.

- [ ] **Step 7: Verify it fails on a wrong count** (temporary edit, then restore)
  Run: change `<n> of 26` to `<n> of 25` in `skills/pm-setup/SKILL.md:146`, run `just validate`, then `git checkout -- skills/pm-setup/SKILL.md`.
  Expected: exit 1 with `- pm-setup/SKILL.md:146: skill count 25, expected 26`; after restore, `git status --porcelain -- skills` prints nothing.

- [ ] **Step 8: Document** in `AGENTS.md`: in the `Validate only` bullet's list, after `markers,` add `pm-setup's skill counts against the shipped skills,`.

- [ ] **Step 9: Full check**
  Run: `just lint-check`
  Expected: exit 0 (markdownlint, validate, pm-lint, and `just test` all pass).

- [ ] **Step 10: Commit**

```bash
git add scripts/skill-counts.ts scripts/skill-counts.test.ts scripts/validate.ts AGENTS.md
git commit -m "feat(validate): check pm-setup skill counts (R-006)"
```
