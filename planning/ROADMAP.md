# Roadmap

<!--
IDs are R-NNN, never reused. A new ID is the highest number in ROADMAP.md,
NOW.md, and LOG.md, plus 1. pm-next takes the first claimable item in Next:
Status ready or paused, Owner agent or both, every Depends on ID done.
Owner user items are done by the user and closed with pm-item done.
Position is the order of the item blocks: Next is the claim order; Later is
grouped by milestone in STRATEGY.md order. Move, add, and insert with
pm-item, pm-board, or pm-roadmap (rules: Roadmap order and edits).
-->

## Next

<!-- Ordered. Maximum is set in config.md. -->

### R-025 Docs-site package: feature pages list revisions

- Serves: V4
- Milestone: M1
- Owner: agent
- Done when: a feature page for an item that another item's `Revisits` names lists that item under "Revised by", and a unit test in `packages/pm-docs-site` covers it.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-012 design (2026-11-19): `dependents()` in `packages/pm-docs-site/src/lib/planning.ts` looks only at `dependsOn`, so a feature page lists its dependants but not the items whose `Revisits` names it; the R-012 graph already draws Revisits edges.

### R-013 Docs-site package: publish and migrate

- Serves: V4
- Milestone: M1
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns the released version; `docs-site/` holds only `package.json`, `astro.config.ts`, `bun.lock`, and `.gitignore` and `just docs-check` passes; two builds from the same `planning.json` and lockfile give byte-identical HTML; and a scratch export at schemaVersion 4 fails the build until the package's range includes it.
- Size: M
- Depends on: R-009, R-010, R-011, R-012, R-014, R-019, R-027, R-028, R-029, R-031
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: Rewrites `pm-docs-site` and Non-interruption rule 9, so it bumps the rules major.

### R-033 ADR directory setting and design handoff

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-init` in a scratch repository with `docs/adr/` writes `ADR directory: docs/adr/` to `planning/config.md` and `pm-lint check` passes; `pm-next` step 10's handoff names the ADR directory and tells the design skill to read it and write one ADR per architecture decision; the managed section names the directory and the product, technical, and spec split; `pm-help` reports `ADR directory: none` with `pm-setup` as the fix; `just validate` passes.
- Size: M
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-22-where-do-adrs-fit.md

### R-034 Engineering file and pm-engineering skill

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-engineering add` writes a linted entry to `planning/ENGINEERING.md` (`## Technology` and `## Principles`, each entry citing its `Source`), and the skill is listed in the README, managed-section, `pm-setup`, and `pm-help` tables with `just validate` and `just test` passing.
- Size: M
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-035 pm-engineering infer from an existing repository

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: in a scratch repository with `package.json`, `tsconfig.json`, and `AGENTS.md`, `pm-engineering infer` writes an `ENGINEERING.md` citing all three; `pm-init` runs it for an existing repository and `pm-setup` offers it on upgrade.
- Size: M
- Depends on: R-034
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-036 Plan citation and done check

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `pm-next` and `pm-checkpoint` (`stage`) pass the principles and ADRs that apply to the plan handoff; `pm-checkpoint` (`done`) refuses to close on a failing command check and lists failed review checks as a `Note` and an inbox file, shown in a rehearsal report in `planning/research/`; `pm-purview` hands accepted packages to `pm-engineering add`.
- Size: M
- Depends on: R-033, R-034
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-037 Engineering export and docs-site view

- Serves: V5
- Milestone: M4
- Owner: agent
- Done when: `planning.json` carries the engineering record at the next `schemaVersion`, `pm-export check` passes, and an Engineering view passes `just docs-check`.
- Size: S
- Depends on: R-034, R-013
- Status: ready
- Brief: planning/briefs/2026-11-20-technology-and-engineering-principles.md

### R-006 Check pm-setup's skill counts in validate

- Serves: V1
- Milestone: M2
- Owner: agent
- Done when: `just validate` fails when the `<n> of 22` counts in `pm-setup` differ from the number of shipped skills.
- Size: S
- Depends on: none
- Status: ready

### R-015 Rehearse a fresh install in a scratch repository

- Serves: V1
- Milestone: M2
- Owner: agent
- Done when: in an empty scratch repository, `npx skills add https://github.com/purview-dev/pm-skills -y` then `pm-setup` reports every pm-* and workflow skill installed, recorded in a report in `planning/research/`.
- Size: S
- Depends on: none
- Status: ready

### R-016 Rehearse the lifecycle guards

- Serves: V2, V3
- Milestone: M3
- Owner: both
- Done when: a report in `planning/research/` shows `pm-resume` naming the active item, stage, and next action after `/clear`, and `pm-shape` parking an idea instead of running during an active workflow.
- Size: M
- Depends on: none
- Status: ready

### R-024 Self-contained aspire module test example

- Serves: V4
- Owner: agent
- Done when: the TUnit example in `skills/pm-docs-site/templates/aspire/MODULE.md` defines `BuildAsync` and `Named`, includes `using Aspire.Hosting;`, and says when to use the literal `"docs"` instead of `Resources.DocsSite`.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-004 execute (2026-11-17): verifying R-004 needed `using Aspire.Hosting;` for `DistributedApplicationExecutionContext` and the literal `"docs"`, because a test project reaches `Resources.DocsSite` only when the constant is visible to it. Spec: `docs/superpowers/specs/2026-11-17-aspire-module-verification.md`.

### R-030 Pre-push runs fast checks only

- Serves: V4
- Owner: agent
- Done when: the lefthook pre-push hook no longer runs `package-test`, finishes offline in under 15 seconds, and CI still runs `just package-test` on every pull request.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review (question, decided: CI-only package-test). R-008 added `package-test` to `just lint-check`, which the lefthook pre-push hook runs. It adds two Astro builds, a pack, and a networked `bun install` to every push: about 40 to 60 seconds, and a push fails offline. Files: `justfile`, `.config/lefthook.yml`.

### R-032 pm-checkpoint and pm-lint Note follow-ups

- Serves: V2
- Owner: agent
- Done when: `pm-checkpoint` `switch` restores `Note` from the claim commit when `NOW.md` lacks one, the `now/fields` rule text says "an optional Note after Revisits", a `lint.test.ts` case fails a `Note` without the five item fields, and `just lint-check` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review; R-026 final-review minors, a rules bump. (1) `skills/pm-lint/scripts/structure.ts` comment on `NOW_NOTE` says "rules 22"; the change shipped on rules 21 (21.0.0-pre.2). (2) The R-026 spec (design item 6) and plan (Task 3) still describe `just bump major` to rules 22; add a superseded line. (3) The `now/fields` rule text in `rules.md`, `rules.ts`, and the `checkNow` message says "and then an optional Note", readable as after `Started`; say "an optional Note after Revisits". (4) `pm-checkpoint` `switch` recovery runs only when `Serves`/`Size` are missing and never restores `Note`, so an item claimed under 21.0.0-pre.1 switches back without it; also restore `Note` from the claim-commit block. (5) `pm-next` steps 3 and 5 can each hold a `Note:`, but step 7 joins "a held note" in the singular; state the order for two. (6) A blank `- Note:` on an item: say "a non-empty Note" in `pm-next` step 7 and `pm-rejoin` step 3. (7) No test pins that a `Note` without the five item fields fails `now/fields`.
