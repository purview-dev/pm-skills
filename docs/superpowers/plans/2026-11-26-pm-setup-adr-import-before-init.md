# pm-setup suggests ADR import before init Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** `pm-setup` prints the outside-ADR-folder Note on every run, including before `pm-init`.

**Architecture:** Move the read-only check out of Step 5, item 4 (gated on `config.md`) into a new Step 5, item 7 that always runs, with a second Note form for a repository without PM state. A `scripts/validate.ts` guard pins it.

**Tech Stack:** Markdown skills, Bun (`scripts/validate.ts`), just.

**Spec:** `docs/superpowers/specs/2026-11-26-pm-setup-adr-import-before-init-design.md`

## Global Constraints

- ADRs stay in the PM root; the Note points at `pm-adr import` (ADR-001 ADRs live in the PM root).
- Note with `config.md`: `Existing ADRs in <folder>. Run pm-adr import <folder> to bring them in.`
- Note without `config.md`: `Existing ADRs in <folder>. After pm-init, run pm-adr import <folder> to bring them in.`
- Folders checked: `docs/adr/`, `docs/decisions/`, `doc/adr/`, `docs/architecture/decisions/`; only when `<PM state directory>/decisions/` does not exist. No question, no write.
- Version `21.0.0-pre.13` to `21.0.0-pre.14` (`just bump prerelease`); rules text unchanged.
- Commit subjects lowercase (commitlint).

## Review Focus

1. Two outside folders exist (`docs/adr/` and `docs/decisions/`): the Note names the first in the listed order. Pinned in Task 1 step 3 text.
2. `decisions/` exists but is empty: no Note (the check is "does not exist"). Unchanged behaviour; Task 2 does not need it.
3. Item 4's other checks still run only with `config.md`: Task 1 removes only the ADR paragraph.

---

### Task 1: Item 7 and its guard

**Files:**

- Modify: `skills/pm-setup/SKILL.md:244-248` (remove), Step 5 (add item 7 after item 6), Output `Note` line (~312)
- Modify: `scripts/validate.ts` (after the R-036 guards)
- Modify: `package.json` (via `just bump prerelease`)

- [x] **Step 1: Add the failing guard** in `scripts/validate.ts`: `skills/pm-setup/SKILL.md` must contain `After pm-init, run pm-adr import <folder>` and `**Outside ADR folder (read-only)**`; fail with `skills/pm-setup/SKILL.md: the outside ADR check does not run before pm-init`. Comment: `// pm-setup checks for an outside ADR folder before pm-init too (R-057).`
- [x] **Step 2: Run `just validate`.** Expected: FAIL with that line.
- [x] **Step 3: Edit `skills/pm-setup/SKILL.md`:** delete the "Also check, read-only" paragraph from item 4; add item 7 **Outside ADR folder (read-only)**, which runs whether or not `config.md` exists, with the condition and both Notes from Global Constraints, naming the first matching folder in the listed order (ADR-001); the Output `Note` line lists both forms.
- [x] **Step 4: Run `just validate` and `bunx markdownlint-cli2 skills/pm-setup/SKILL.md`.** Expected: PASS, 0 issues.
- [x] **Step 5: Run `just bump prerelease`.** Expected: `package.json` is `21.0.0-pre.14`.
- [x] **Step 6: Commit**

```bash
git add scripts/validate.ts skills/pm-setup/SKILL.md package.json
git commit -m "fix(pm-setup): check for an outside adr folder before pm-init (R-057)"
```

### Task 2: Scratch-repository evidence

- [x] **Step 1:** In a new empty `%TEMP%` folder: `git init`, `docs/adr/0001-example.md` (one MADR heading), no `planning/`. A fresh agent session follows the edited `skills/pm-setup/SKILL.md` there (Step 1 to Step 6; take recommended options). Expected output Note: `Existing ADRs in docs/adr/. After pm-init, run pm-adr import docs/adr/ to bring them in.`
- [x] **Step 2:** Save the command list and the output's `Note` line for the pull request description.
- [x] **Step 3: Run `just lint-check` and `just version-check`.** Expected: PASS.
