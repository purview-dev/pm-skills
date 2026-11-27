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

### R-059 pm-setup runs read-only checks on a current install

- Serves: V1
- Owner: agent
- Done when: on an install whose `Rules version` equals the skills version, `pm-setup` prints the read-only Step 5 checks, including the Note about an ADR folder outside the PM root, before it stops; each skill-count message from `just validate` names the installed count or the total; `just validate` and `just test` pass.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-27 review (inbox 2026-11-26-1130, question, agent, from R-057 execute). pm-setup Step 4 stops after showing the plan when the install is already current, so Step 5 never runs; the read-only Step 5 checks (item 7, the outside ADR folder Note) then never surface on a current install. Decide whether read-only checks belong before the Step 4 stop. Files: `skills/pm-setup/SKILL.md`, `scripts/skill-counts.ts`. A `skills/` change, so `just bump prerelease`. Also from R-006 (inbox 2026-11-26-1541): when both numbers on the output line (`- Skills: <27 of 27 installed`) are wrong, validate prints two identical messages (`skill count 27, expected 26`), so the reader cannot tell the installed count from the total; name which number each message is about ("installed count" or "total").

### R-060 Docs-site package: review minors after R-042

- Serves: V4
- Milestone: M5
- Owner: agent
- Done when: each finding listed in this Note is fixed or has a one-line won't-fix reason in the item's plan, and `just package-test` passes.
- Size: M
- Depends on: none
- Status: ready
- Note: From the 2026-11-27 review; review minors in `packages/pm-docs-site`. R-058 (inbox 2026-11-26-1412): (1) the comment above `adrs:` in `src/content.config.ts` still says the sections are rendered there (ADR-015 moved rendering to `adr-sections`). (2) No test pins a whitespace-only section as blank (`hasContent('  \n')` in `src/loaders/adrs.ts`); the fixture's empty section is `""`. (3) The Decisions-view-off integration test does not assert the build skips the empty `adr-sections` collection (no "does not exist or is empty" warning). (4) `src/lib/site-refs.ts` repeats the loader's non-empty-section predicate inline; export one predicate beside `hasContent`. R-042 final review (2026-11-27): (5) the README CLI section and the `lib/cli.ts` header do not describe `--flag=value`, the unknown-option error, or that an empty value such as `--title ''` is now an error. (6) `boardUrl` in `src/lib/board.ts` re-encodes and reorders the query keys the board does not own (`?flag` becomes `?flag=`, `%20` becomes `+`). (7) `BOARD_KEYS` in `src/lib/board.ts` and the inline key list in `src/components/PlanInteractions.astro` have no test keeping them equal. (8) `stripComments` in `test/helpers.ts` treats an apostrophe in JSX text as a quote, as it does a regex literal. (9) `test/helpers.ts` and `test/island-imports.test.ts` each define a `stripComments`. R-052 (inbox 2026-11-26-1855): (10) `skills/pm-export/SKILL.md` field map: the `inbox[]` key list omits `sections[]` (the prose after it describes it); a `skills/` change, so `just bump prerelease`. (11) `src/lib/references.ts`: a brief page appears in Linked from as its title only ("Invoice export"), while its page title and feature and ADR pages use `<ID> <title>`. (12) `src/routes/plan/inbox.astro`: every card's `Open` link has the same accessible name; add an `aria-label` naming the entry. (13) `src/components/RecordSections.astro`: section headings render as raw text, so inline Markdown or an ID in a heading is neither formatted nor linked. (14) `src/routes/plan/inbox/[slug].astro`: the description starts lower case ("bug in the inbox"). Also noted: a relative Markdown link in a brief or inbox section resolves page-relative, as on ADR pages, and goes nowhere. R-056 (inbox 2026-11-27-0000): (15) `test/cli.test.ts` `peers` tests: two `runCli` calls with 50000ms child limits under one 60000ms `CHECK` test, and one under bun's 5000ms default, so a hung child there is killed by bun without its output. (16) `test/helpers.test.ts` kills a build after 50ms, before Astro loads, so no test shows a part-built scratch folder is removable after a kill on Windows; it also builds the shared `test/fixtures/site` that `cli.test.ts` builds, where a `scratchFixture` would keep them apart. (17) `test/hydration.test.ts` misses an arrow-function `hydrated` and accepts `HYDRATED` written only in a comment.

### R-054 Git subprocess tests stable under load

- Serves: V4
- Owner: agent
- Done when: `bun test scripts/` and the `skills/pm-lint` and `skills/pm-next/scripts/sync.test.ts` suites pass three runs in a row while `just package-test` runs at the same time, and `just test` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-25 review (inbox 2026-11-24-2045, R-013 execute). During R-013, `bun test scripts/` gave 198 pass and 5 fail while builds and browser tests ran at the same time, and the same suite gave 244 pass and 0 fail on an idle machine. The failing tests were seen in `skills/pm-lint` and `skills/pm-next/scripts/sync.test.ts`, which spawn git subprocesses; they time out or race under load, so a pre-push `just lint-check` can fail without a code change.

### R-051 PM sync review minors

- Serves: V2
- Owner: agent
- Done when: each of the five findings in this Note is fixed or has a one-line won't-fix reason in the item's plan, `skills/pm-next/scripts/sync.test.ts` covers a detached HEAD, `core.autocrlf=true`, and a remote name containing `/`, and `just test` passes.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-25 review (inbox 2026-11-22-1933, R-044 execute). Deferred minors from the R-044 final review. (1) `release` reports a pure fast-forward of the PM branch as "Moved 0 PM commits". (2) The carry commit does not consult `PM state commit: ask | never`, and a carry onto a PM branch that is not checked out leaves `planning.json` stale (reported in its line). (3) No test for a detached HEAD or `core.autocrlf=true`. (4) Remote names containing `/` are split wrongly in `options()`, and a PM branch that exists only on the remote makes `rev-list` throw (fails safe). (5) Existing behaviour, not R-044: PM commits made on a pending pull request's branch after its last push are never delivered if the pull request merges without another push.

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-053 Docs-site package: release 1.0.0

- Serves: V4
- Milestone: M5
- Owner: both
- Done when: `npm view @purview-dev/pm-docs-site version` returns `1.0.0`, the `pm-docs-site-v1.0.0` tag exists, and the package README holds complete user instructions for every view.
- Size: S
- Depends on: R-052
- Status: ready
- Brief: planning/briefs/2026-11-17-docs-site-package.md
- Note: From the 2026-11-25 review (inbox 2026-11-23-1525, user, R-013 design). Not stable until it contains everything, with complete instructions (user, 2026-11-23). Release `@purview-dev/pm-docs-site` 1.0.0 once R-013, R-045 Docs-site package: architecture view, and the brief and inbox pages, and research items are done (S, both). This replaces the brief's 2026-11-18 answer that R-013 releases 1.0.0; R-013 publishes 0.1.0-pre.4 instead. The research reports item is being shaped (inbox 2026-11-23-1525-docs-site-package-research.md); add its ID to `Depends on` when pm-shape creates it.

### R-030 Pre-push runs fast checks only

- Serves: V4
- Owner: agent
- Done when: the lefthook pre-push hook no longer runs `package-test`, finishes offline in under 15 seconds, and CI still runs `just package-test` on every pull request.
- Size: S
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review (question, decided: CI-only package-test). R-008 added `package-test` to `just lint-check`, which the lefthook pre-push hook runs. It adds two Astro builds, a pack, and a networked `bun install` to every push: about 40 to 60 seconds, and a push fails offline. Files: `justfile`, `.config/lefthook.yml`.

### R-024 Self-contained aspire module test example

- Serves: V4
- Owner: agent
- Done when: the TUnit example in `skills/pm-docs-site/templates/aspire/MODULE.md` defines `BuildAsync` and `Named`, includes `using Aspire.Hosting;`, and says when to use the literal `"docs"` instead of `Resources.DocsSite`.
- Size: S
- Depends on: none
- Status: ready
- Note: From R-004 execute (2026-11-17): verifying R-004 needed `using Aspire.Hosting;` for `DistributedApplicationExecutionContext` and the literal `"docs"`, because a test project reaches `Resources.DocsSite` only when the constant is visible to it. Spec: `docs/superpowers/specs/2026-11-17-aspire-module-verification.md`.

### R-032 pm-checkpoint and pm-lint Note follow-ups

- Serves: V2
- Owner: agent
- Done when: `pm-checkpoint` `switch` restores `Note` from the claim commit when `NOW.md` lacks one, the `now/fields` rule text says "an optional Note after Revisits", a `lint.test.ts` case fails a `Note` without the five item fields, and `just lint-check` passes.
- Size: M
- Depends on: none
- Status: ready
- Note: From the 2026-11-20 review; R-026 final-review minors, a rules bump. (1) `skills/pm-lint/scripts/structure.ts` comment on `NOW_NOTE` says "rules 22"; the change shipped on rules 21 (21.0.0-pre.2). (2) The R-026 spec (design item 6) and plan (Task 3) still describe `just bump major` to rules 22; add a superseded line. (3) The `now/fields` rule text in `rules.md`, `rules.ts`, and the `checkNow` message says "and then an optional Note", readable as after `Started`; say "an optional Note after Revisits". (4) `pm-checkpoint` `switch` recovery runs only when `Serves`/`Size` are missing and never restores `Note`, so an item claimed under 21.0.0-pre.1 switches back without it; also restore `Note` from the claim-commit block. (5) `pm-next` steps 3 and 5 can each hold a `Note:`, but step 7 joins "a held note" in the singular; state the order for two. (6) A blank `- Note:` on an item: say "a non-empty Note" in `pm-next` step 7 and `pm-rejoin` step 3. (7) No test pins that a `Note` without the five item fields fails `now/fields`. From the 2026-11-22 review (inbox 2026-11-22-1425): (8) `expandTargets` in `skills/pm-lint/scripts/lint.ts` (added in `981977a`) expands a folder argument one level only, so `check planning/` misses `inbox/`, `briefs/`, and `decisions/` files; recurse, and test it. (9) No test covers `--staged` with a folder argument. (10) Cosmetic: ADR-001's Alternatives row says ADRs are "exported" (quoted from the spec), and the `pm-init` template row keeps "(new project only)" inside the code span because `scripts/validate.ts` parses it. From the 2026-11-26 review (bug, inbox 2026-11-26-0300, severity minor, from R-036 execute): (11) `pm-checkpoint switch` run on an item branch writes NOW.md and ROADMAP.md, then the PM commit's recommended option `Switch to main and commit` fails: `git switch` refuses because NOW.md and ROADMAP.md differ between the item branch and main. Reproduction: the M4 rehearsal re-run (`planning/research/2026-11-26-m4-rehearsal.md`, Skill defects found); claim an item on its branch, stage it to plan, run `pm-checkpoint switch`, accept the recommended option. Every run. From the 2026-11-27 review (inbox 2026-11-25-1605, R-055 final review): (12) `engineering/values` and `engineering/decision-current` messages name a technology headed `### EP-001 Bun` as `EP-001`, because `checkEngineeringValues` uses `block.id || block.title`; use `block.name` for Technology blocks. (13) The `engineering/removed` message says "A removed entry is", while the rule text now says "A removed line is". (14) The `pm-engineering` view recommends `change <entry> Decision <ADR-MMM>` with the immediate successor, not the end of the `superseded by` chain that step 1 now follows; a deprecated chain end has no ADR to suggest. (15) The "orders technology with English collation" test passes on an English-locale host without the `"en"` argument; add a case where code-point order and English collation differ. (16) `pm-engineering` step 4 (`change`) does not name the Challenge protocol checks that the managed section now says apply to it.

### R-046 Upgrade, format, and git rules move to references

- Serves: V2
- Owner: agent
- Done when: the managed section holds no `Version N` paragraphs, no file-format blocks, and no Committing PM state, Completion rides the branch, Feature branches, PM sync, Pull latest, or PM base bodies; `skills/pm-setup/references/upgrade.md`, `formats.md`, and `git.md` hold them; every `SKILL.md` that cites one names its file; `just validate` fails when a cited reference file is missing; the R-043 report's `always` line is at least 6,500 tokens lower than its baseline.
- Size: M
- Depends on: R-043
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 2 of 5 from pm-shape 2026-11-24. A rules change; may stay on rules 21 while `main` is the unreleased `21.0.0-pre.N` line.

### R-047 Core rules file and a 15 KB managed section

- Serves: V2
- Owner: agent
- Done when: the managed section is 15,000 characters or less and holds the skill table, the Non-interruption rules, Read before deciding, and a pointer index; `skills/pm-setup/references/rules.md` holds the remaining shared rules and each PM skill reads it once per session; `just validate` fails above 15,000 characters; `pm-help` diagnose reports a missing reference file.
- Size: M
- Depends on: R-046
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 3 of 5 from pm-shape 2026-11-24. A rules change.

### R-048 Repository AGENTS.md top part into dedicated files

- Serves: V2
- Owner: agent
- Done when: this repository's top part of `AGENTS.md` (before the managed section) is 3,000 characters or less and indexes the dedicated files that now hold its content; `just lint-check` and `just validate` pass.
- Size: S
- Depends on: none
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 4 of 5 from pm-shape 2026-11-24. No `skills/` change, so no rules bump. The target folder is decided in design.

### R-049 Trim the largest SKILL.md files

- Serves: V2
- Owner: agent
- Done when: `pm-export`, `pm-docs-site`, `pm-setup`, `pm-help`, and `pm-checkpoint` `SKILL.md` are each at least 30% smaller, with the moved modes in their `references/`; the R-043 report's `claim` and `checkpoint` lines are lower than after R-047; `just lint-check` passes.
- Size: M
- Depends on: R-047
- Status: ready
- Brief: planning/briefs/2026-11-22-agent-context-tidy.md
- Note: Slice 5 of 5 from pm-shape 2026-11-24. A rules change. Conflicts with R-041 and R-032 edits to the same skills.
