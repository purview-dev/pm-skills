# Technology and engineering principles sections

- Status: on roadmap (R-036), active
- Origin: planning/inbox/2026-11-20-1528-technology-and-engineering-principles.md
- Updated: 2026-11-24

## Problem

- A solo developer's technology choices, adopted packages, and engineering principles are decided once and then lost: nothing in PM state records what was adopted and why (answer 2026-11-20).
- Agents then build items that break those choices and principles, because no stage reads them or checks work against them (answer 2026-11-20).

## Who and evidence

- `planning/VISION.md` `## Constraints` holds technology in one line (`Stack: Markdown skills, Bun scripts, just, markdownlint-cli2, GitHub Actions`). No PM file records engineering principles or the rules that go with each technology.
- `skills/pm-init/SKILL.md` step 4, question 5 asks for "any fixed technology choices" only, and step 5 challenges a stack answer that differs from the manifests, so pm-init already reads the repository's manifests.
- This repository's principles live in `AGENTS.md` (Repository conventions) and in the auto-memory (TypeScript always, Bun preferred, no shell in a justfile, React islands for docs-site views). No pm-* skill reads them or checks work against them.
- `skills/pm-purview/` recommends .NET packages, and its accepted recommendations become roadmap items, but nothing records the adopted package or its rules afterwards.
- `Done when` checks and plan checkboxes are checked in `execute` and by `pm-checkpoint` (`done`), against the item only, not against technology or pattern rules.
- `STACK.md` is already taken: it is the operation stack (Shared definitions: Stack file). A new file needs another name.
- Not found in `LOG.md` `## Dropped`, `ROADMAP.md`, or another brief. It does not match `Out of scope` in `VISION.md`.

## Original idea

Include a 'technology' and 'engineering principals' section. It should be part of init/ updatable later and new packages and rules and technologies are introducted.

It should be also work things out based on existing repos.

All checklist items must be checked off against the relevent technology/ patterns rules.

## Proposal

- A new optional PM file, `<PM root>/ENGINEERING.md`: `## Technology` (runtime, frameworks, packages, tools, each with version, reason, and `Source`) and `## Principles` (each with `Applies to` globs, `Check: <command> | review`, and `Source`).
- A new skill, `pm-engineering`, owns it: `infer`, `view`, `add`, `change`, `remove`. `pm-purview` hands accepted packages to `add`.
- `pm-init` runs `infer` on an existing repository and asks for principles on an empty one; `pm-setup` offers `infer` once on upgrade.
- The plan handoff is told which principles apply to the spec's files, so plan tasks cite them.
- `pm-checkpoint` (`done`) runs the applicable checks: a failing command blocks the close, and a failing review is a `Note` plus an inbox file.

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing: conventions stay in `AGENTS.md` and `VISION.md` Constraints | none | No new file, skill, or rules bump | Choices stay unrecorded in PM state; nothing checks work against them |
| Smallest: `ENGINEERING.md` template written by `pm-init` (manifests and agent files only), hand-edited later, checked by `pm-checkpoint` (`done`) | M | Records choices and adds the done check | No owner after init; no plan-stage citation; no inference for existing installs |
| Full idea, sliced (recommended): `ENGINEERING.md` plus `pm-engineering` (infer, add, change, remove, view), wired into `pm-init`, `pm-setup`, `pm-purview`, the plan handoff, and `pm-checkpoint` (`done`) | L | Every answer above: recorded, inferred, updated, cited in plans, verified at done | New PM file, skill, lint schema, and help rows; at least 3 rules bumps |
| Pointer: a `## Engineering` section in the managed rules that names the repo's own conventions file, no PM file | S | No duplication of `AGENTS.md` | No record of adopted packages; the check has no structured rules to read |

Recommended: the full idea, sliced. Strongest argument against: no `V` line or milestone in `STRATEGY.md` covers it, and it delays M1 Reproducible docs site, the current focus.

## Challenges and answers

- 2026-11-20 Where the check runs. Answer: both. Plan tasks cite the principles they must follow, and `pm-checkpoint` (`done`) verifies each checkbox against them before the completion record.
- 2026-11-20 Who updates it later. Answer: a new `pm-engineering` skill owns the file (infer, add, change, remove, view); `pm-purview` and the done check hand new packages and technologies to it.
- 2026-11-20 What inference reads. Answer: all of manifests and lockfiles, config and tooling (tsconfig, linters, justfile, CI, hooks), agent instruction files (AGENTS.md, CLAUDE.md, CONTRIBUTING.md), code patterns, and code analysis. Each inferred principle cites its source and is confirmed with the user.
- 2026-11-20 Existing installs. Answer: `pm-setup` offers inference once on the rules upgrade; until then a missing file is empty, like `RISKS.md`.
- 2026-11-20 Where the record lives: a new PM file, sections in `VISION.md`, or a pointer to `AGENTS.md`. Answer: a new PM file in the PM root with `## Technology` and `## Principles`, written by `pm-init`, linted, and exported.
- 2026-11-20 Fit. Claim: none of V1 to V4 in `VISION.md` and none of M1 to M3 in `STRATEGY.md` covers it; M1 Reproducible docs site is the current focus. SCOPE CHANGE to v1. Answer: park it, and add a `V` line and a milestone after M1 through `pm-strategy`; the slices then go to Later under that milestone.
- 2026-11-20 Enforcement. Claim: most principles ("TypeScript always") need judgment, not a command. Answer: each principle has `Check: <command> | review`; a failing command check blocks `pm-checkpoint` (`done`), and a failing review check is listed as a `Note` and parked, not blocking.
- 2026-11-20 Export. Answer: a later slice. The first slices are the file, the skill, and the checks; the `planning.json` field (`schemaVersion` 5) and a docs-site view follow after M1 ships the package.
- 2026-11-20 Plan-stage citation. Claim: plans are written by the `plan` handoff skill (`superpowers:writing-plans`), and PM skills never edit plan files (Non-interruption rule 6). So the citation is passed in the handoff: `pm-checkpoint` (`stage`, after design) and `pm-next` tell the plan skill which principles apply. Not put to the user: it follows from the rules.
- 2026-11-20 Duplication. Claim: this repository's principles already live in `AGENTS.md` Repository conventions, so a copy can drift. Mitigation: each inferred principle records its `Source` (file and heading), and `pm-engineering` (`infer`) reports a principle whose source changed. Not put to the user: mitigation, not a scope change.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | New optional PM file `<PM root>/ENGINEERING.md`; older installs have none | A missing file is empty (Optional files); `pm-setup` offers `infer` once on upgrade |
| Security and privacy | Inference reads agent files and code; a principle could quote a secret from config | `infer` records names and versions only, never values from config or env files |
| Performance | `infer` with code analysis reads many files; the done check adds commands to every close | `infer` runs in a subagent and writes the file; done runs only the command checks whose `Applies to` globs match the changed files |
| User experience | `pm-init` gains confirmation questions; done gains a principles block | Inferred entries are confirmed in one multi-select per section, not one question each |
| Operations and cost | none found | none |
| Maintenance | New skill: four consumer tables, `pm-help` row and diagnosis, `pm-lint` schema and rule, `pm-init` template; three or more rules bumps | Ship in slices; each slice changes its rule and test in the same commit (AGENTS.md) |
| Dependencies | `pm-init`, `pm-setup`, `pm-purview`, `pm-next`, `pm-checkpoint` (`stage`, `done`), `pm-lint`, `pm-help`; export and `pm-docs-site` in the last slice. No open roadmap item depends on it | Last slice waits for R-013 Docs-site package: publish and migrate |
| Reversibility | The file is optional; removing the skill leaves an unread file | Each slice is reversible by reverting its rules version |

## Done when

- `pm-init` in a scratch repository with a `package.json` and an `AGENTS.md` writes `planning/ENGINEERING.md` with `## Technology` and `## Principles`, each entry citing its `Source`, and `pm-lint check` passes on it.
- `pm-engineering add` records a new package with its rules, and `pm-purview` hands an accepted package to it.
- A plan handoff after design names the principles whose `Applies to` matches the spec's files.
- `pm-checkpoint` (`done`) refuses to close when a command check fails, and lists failed review checks as a `Note` and an inbox file.
- `just validate` and `just test` pass with the new skill listed in the README, managed-section, `pm-setup`, and `pm-help` tables.

## Size and slicing

Size L, sliced into four parts in dependency order:

1. **Engineering file and `pm-engineering` (M):** Shared definition, `pm-init` template, `pm-lint` schema and rule, the skill with `view`, `add`, `change`, `remove`. Done when: `pm-engineering add` writes a linted entry, and the skill is in all four tables.
2. **Inference (M):** `pm-engineering infer` from manifests, lockfiles, config and tooling, agent files, code patterns, and code analysis; `pm-init` runs it for an existing repository; `pm-setup` offers it on upgrade. Done when: a scratch repository with `package.json`, `tsconfig.json`, and `AGENTS.md` gets an `ENGINEERING.md` citing all three.
3. **Plan citation and done check (M):** `pm-next` and `pm-checkpoint` (`stage`) pass the applicable principles to the plan handoff; `pm-checkpoint` (`done`) runs command checks (blocking) and review checks (Note and inbox file); `pm-purview` hands accepted packages to `pm-engineering add`. Done when: the done check refuses a failing command check in a rehearsal.
4. **Export and docs-site view (S):** `planning.json` field, `schemaVersion` 5, an Engineering view. Depends on R-013 Docs-site package: publish and migrate. Done when: `pm-export check` and `just docs-check` pass with the view.

Proposed for every slice: Serves a new `V` line (to be written by `pm-strategy`), Milestone a new milestone after M1, Owner `agent`.

## Open questions

- The `V` line and milestone this serves: decided by `pm-strategy`.
- File name: `ENGINEERING.md` is the working name (`STACK.md` is taken by the operation stack).

## Decision

- 2026-11-20 Keep it parked. Reason: SCOPE CHANGE to v1; no `V` line or milestone covers it and M1 Reproducible docs site is the current focus. Next: `pm-strategy` adds a `V` line and a milestone after M1, then the four slices go to Later under it.
- 2026-11-22 Added as R-034 and R-035 (Next) and R-036 and R-037 (Later), M4 Recorded technical decisions, serving V5, through pm-strategy.

## Revisions

- 2026-11-25 R-036's Done when said `pm-purview` hands accepted packages to `pm-engineering add` at acceptance, which would list a package before it is installed. Must now: an item `pm-purview` accepted records its package in `ENGINEERING.md` through `pm-engineering add`'s write steps when `pm-checkpoint` (`done`) closes it (ADR-014 Purview packages are recorded at item close, proposed). Mode: fix-in-place. Supersedes: none.
