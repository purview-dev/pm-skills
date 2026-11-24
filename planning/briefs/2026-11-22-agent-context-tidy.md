# Agent context analysis and planning tidy skill

- Status: on roadmap (R-043, R-046, R-047, R-048, R-049), active
- Origin: planning/inbox/2026-11-22-1232-agent-context-tidy-skill.md
- Updated: 2026-11-24

## Problem

- An agent session loads the managed rules (65 KB) on every start, plus each skill it runs, plus the PM files those skills read. Nothing measures that cost per session type, so growth in the rules, the skills, or the planning state goes unnoticed until it hurts (answer 2026-11-22: both rules and state, measured first).
- Today there is no observed symptom; the work is preventive, against the trend of a section that gains a paragraph with every rules version (answer 2026-11-22).
- Outcome that shows it worked: a per-session token report, one line per session type (for example resume, claim and design, checkpoint, review), whose numbers drop by a set percentage after the fixes (answer 2026-11-22).
- Reshape 2026-11-24: the goal widens from measuring to cutting. Target: the always-loaded managed section is 15 KB or less, from 69.5 KB (answer 2026-11-24).
- Scope (answer 2026-11-24): move the upgrade notes and upgrade check, the file formats, and the git and commit mechanics out of the managed section; move this repository's own top part of `AGENTS.md` into dedicated files; and trim the 25 `SKILL.md` files too.
- Location (answer 2026-11-24): rules moved out of the managed section live in `skills/pm-setup/references/`, read on demand the way skills already reach `<pm-next skill>/scripts/sync.ts`.

## Who and evidence

- Measured 2026-11-22. The managed section (`skills/pm-setup/references/AGENTS-section.md`) is 64.9 KB, roughly 16,000 tokens. It is installed in `AGENTS.md`, which every agent session loads before any skill runs, so every session pays that cost, including sessions that never touch PM work. This repository's `AGENTS.md` is 81.8 KB.
- How the section breaks down: Shared definitions 19.6 KB, Upgrading before work resumes 9.3 KB (of which 13 `Version N` upgrade-note paragraphs only `pm-setup` and an upgrade need), Committing PM state 8.0 KB, Non-interruption rules 7.3 KB, and the rest 2.9 KB or less each.
- Skills load on demand: the 25 `skills/pm-*/SKILL.md` files total 236 KB. The largest are `pm-export` 18.8 KB, `pm-docs-site` 17.5 KB, `pm-setup` 17.4 KB, `pm-help` 15.7 KB, and `pm-checkpoint` 15.0 KB. A single lifecycle session (`pm-resume`, `pm-next`, `pm-checkpoint`) reads three of them on top of the section.
- The PM state files are small. `ROADMAP.md` is 16.1 KB for 15 items, mostly from long `Note:` lines (R-032 and R-042 each hold 10 to 19 findings after the 2026-11-22 review). `LOG.md` is 7.2 KB, and the largest brief is 20.7 KB. `planning.json` (75 KB) and `planning.schema.json` (30.5 KB) are derived, and the Context budget rule says never to read them as state.
- Existing rules already cover reading: **Context budget** (version 13) limits reads to the named files and parts, uses one context per item, and has stage boundaries drop exploration. Nothing yet measures cost, and nothing trims the installed rules or prunes old PM state.
- Re-measured 2026-11-24 (characters). `AGENTS.md` is 86,844: this repository's own top part 17,390 (Project structure and architecture 7,705, Build, test, and lint 7,508, Repository conventions 2,155) and the managed section 69,454 (about 17,400 tokens). The section grew 4.5 KB in two days.
- Managed section by heading: Shared definitions 21,759, Upgrading before work resumes 10,289 (of which the `Version N` upgrade notes are 7,057), Committing PM state 8,162 (of which Completion rides the branch 1,996), Non-interruption rules 7,889, skill table 4,989, Roadmap order and edits 2,954, Asking the user 2,788, Feature branches 2,573, Communication contract 2,124, Challenge protocol 2,098, Context budget 1,705, Persistence 1,196, Bounded operations 627.
- Largest Shared definitions entries: PM sync 1,523, Quick capture 1,359, Inbox file 1,189, Risk register 1,089, ADR 858, Reference legend 820, PM file format 791, Pause file 676, Brief 610. The file-format entries (Inbox, Risk, ADR, Brief, Pause, Stack, Bug) total about 5,500 and duplicate what `skills/pm-init/templates/` and `skills/pm-lint/references/rules.md` already hold.
- Which skills cite each rule (`skills/pm-*/SKILL.md`, 25 files, 243,766 characters): Non-interruption 26, Communication contract 24, Committing PM state 20, Asking the user 18, Challenge protocol 16, Roadmap order 14, Inbox file 12, Upgrading before work resumes 5, Completion rides the branch 4, Feature branches 3, Risk register 3, Pause file 3, Quick capture 3, PM sync 2. Rules cited by 5 or fewer skills are loaded by every session but needed by few.
- Not found in `LOG.md` `## Dropped`, `Out of scope` in `VISION.md`, or `Not doing` in `STRATEGY.md`. It overlaps no roadmap item. No accepted ADR covers it (ADR-001 to ADR-003 are about ADR storage and export).
- 2026-11-24: no accepted ADR conflicts (ADR-001 to ADR-004 and ADR-007 cover ADR storage, export, close, PM branch sync, and LikeC4 markers). The widened scope edits the same `SKILL.md` files as R-041 ADR skill follow-ups, R-032 pm-checkpoint and pm-lint Note follow-ups, and R-013 Docs-site package: publish and migrate (`pm-docs-site`), so the order of those items matters.

## Original idea

Do a performance analysis to ensure we are agentic token/ context aware. Keep things relevent for agents. This can be a skill for 'tidying up the planning state'

Reshape request (2026-11-24, from pm-up-next):

Performance analysis - reduce the token size, instructions, usage where possible - especially look at AGENTS.md to pull content out into dedicated files

## Proposal

- Add `skills/pm-help/scripts/context.ts`, a dependency-free Bun script that prints estimated tokens (characters / 4) per session type: `always` (the installed managed section), `resume`, `claim`, `checkpoint`, and `review`. Each type is the section plus the named `SKILL.md` files plus the PM files those skills read.
- Give each line its three largest contributors, and a PM state line that recommends a tidy item when `LOG.md`, `ROADMAP.md`, or a brief passes a set size.
- Add a `Context` section to `pm-help` diagnose that runs the script and prints its table.
- Move the 13 `Version N` upgrade notes from the managed section to `skills/pm-setup/references/upgrade-notes.md`. `pm-setup` prints the notes for the versions it crosses.
- Record the report's before and after figures in `planning/research/`.
- Reshape 2026-11-24 (supersedes the bullets above as the item's scope; they become slice 1 and part of slice 2):
  1. The context report script and a baseline `planning/research/` report (R-043).
  2. Move the upgrade notes and upgrade check, the file formats, and the git and commit mechanics out of the managed section into `skills/pm-setup/references/` (`upgrade.md`, `formats.md`, `git.md`). Skills that cite them read the file.
  3. Move the shared PM rules (Shared definitions remainder, Roadmap order, Challenge protocol, Asking the user, Communication contract, Persistence, Context budget, Bounded operations) into one `skills/pm-setup/references/rules.md` that each PM skill reads once per session. The section keeps the skill table, the Non-interruption rules, **Read before deciding**, and a pointer index to the files: 15 KB or less.
  4. Move this repository's own top part of `AGENTS.md` (17 KB) into dedicated files with a short index. No rules bump.
  5. Trim the largest `SKILL.md` files by moving rarely used modes into each skill's `references/`.

## Alternatives considered

| Option | Effort | Main benefit | Main cost |
| --- | --- | --- | --- |
| A. Do nothing | none | No rules bump, no new code | Growth in the 65 KB section and in the skills goes unmeasured, and every rules version adds a paragraph to every session |
| B. Repo-only report (characters / 4) plus moving the upgrade notes | S | Measures and cuts this repository's own cost, with no consumer change for the script | Consumers can't measure their own install or PM root |
| C. Report shipped in `pm-help` (diagnose), dependency-free estimate, plus moving the upgrade notes (**recommended**) | M | Every consumer sees the per-session cost of their install and PM root, read-only, in a skill that already diagnoses the setup | A rules bump; the estimate is approximate |
| D. C with an exact tokenizer package | M | Exact counts | Breaks the dependency-free pattern of the shipped scripts (`pm-export`, `pm-lint`, `pm-docs-site` import only `node:` and `bun:`); no offline tokenizer matches current Claude models |
| E. C plus a `pm-tidy` skill that archives `LOG.md`, done briefs, and long Notes | L | Bounds the planning state as projects age | A new shipped skill (4 consumer tables, more skill text to load) for a problem the evidence doesn't show yet (`LOG.md` 7 KB) |
| F. A size cap on the section in `scripts/validate.ts` only | S | Stops growth at no runtime cost | Measures only this repository's section, not sessions, skills, or state |

| G. C plus a 15 KB managed section: rules, formats, git, and upgrade material in `pm-setup/references/`, the repository-only part in dedicated files, and trimmed skills (**chosen 2026-11-24**) | L, sliced into 5 | Sessions with no PM work save about 14,000 tokens; every rules version stops growing the always-loaded text | Five items and two rules bumps; every PM skill run reads one more file; the rules can go missing from an install without `pm-setup` |
| H. G with a 25 KB section (Asking the user, Communication contract, Challenge protocol stay loaded) | L | Fewer reads in PM skills | About 2,500 tokens more in every session (rejected 2026-11-24) |

- Recommended 2026-11-24: G. Strongest argument against: a PM session saves almost nothing, because it reads `rules.md` instead, and a skill that skips the read acts without the rules it used to get for free. The `Read before deciding` and Non-interruption rules stay in the section for that reason.
- Recommended 2026-11-22: C. Strongest argument against: a characters / 4 estimate can be off by 20% or more against a real tokenizer, so the absolute numbers are rough. The outcome needs relative drops per session type, and an estimate measures those consistently.

## Challenges and answers

- Exact tokenizer (2026-11-22). Challenge: the shipped scripts in `skills/pm-export/scripts/`, `skills/pm-lint/scripts/`, and `skills/pm-docs-site/scripts/` import only `node:` and `bun:` builtins; no offline tokenizer matches current Claude models, and an exact count needs the API with a key and network. Answer: a dependency-free estimate, labelled `estimated tokens`. Reason: the outcome is relative drops per session type, and the skills stay framework-neutral.
- New skill against pm-help (2026-11-22). Challenge: a new skill adds a row to the README, the managed-section table (always loaded), the `pm-setup` inventory, and the `pm-help` guide, which grows the very cost being measured. Answer: ship it in `pm-help` diagnose. Reason: it is already the read-only setup diagnosis.
- Tidy scope (2026-11-22). Challenge: no evidence yet (`LOG.md` 7.2 KB, `ROADMAP.md` 16.1 KB), and the Context budget rules already limit reads to named parts. Answer: defer it; the report's PM state lines recommend a tidy item once they pass a threshold. Reason: measured first.
- Fit: it serves no `V` line directly. The closest is V2 (`pm-resume` works from `planning/` alone), because a smaller always-loaded section leaves more room in each session. No milestone covers it, so it goes in Later, Unassigned, and delays no item in Next. No conflict with `Out of scope`, `Not doing`, or `## Dropped`.
- Assumption: characters / 4 tracks real token counts closely enough that a change shows in the same direction. Signal that it is wrong: a change the report calls smaller makes sessions compact sooner.
- 15 KB target (2026-11-24). Challenge: the Non-interruption rules (7,889) and the skill table (4,989) already fill 12.9 KB, so Asking the user, the Communication contract, and the Challenge protocol (cited by 18, 24, and 16 skills) must move, and almost every PM skill run then reads them. A PM session saves about nothing; sessions with no PM work save about 14,000 tokens. Answer: keep 15 KB, with one core `rules.md` each PM skill reads once per session. Reason: most sessions do no PM work.
- Missing rules (2026-11-24). Challenge: rules read from `pm-setup/references/` vanish silently without `pm-setup`, or go stale with copied skills (`skills` CLI `--cli`); today they sit in `AGENTS.md` without any skill. Answer: guard plus a pointer: the section names each reference file, `pm-help` diagnose reports a missing one, and the upgrade check already stops when `pm-setup` is absent. Reason: `pm-setup` is required already.
- Skills trim in scope (2026-11-24). Challenge: the 25 `SKILL.md` files (243,766 characters) load on demand, so trimming them saves only in the session that runs them, and they are edited by R-041 and R-032 too. Answer: include it, as its own slice after the section split. Reason: user decision.
- Fit (2026-11-24): still V2, no milestone. Five slices in Later, Unassigned delay nothing in Next; moving any into Next delays M1 (R-013) or M4 work.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | None in PM state. A consumer's `AGENTS.md` shrinks from about 69 KB of managed section to 15 KB or less on the next `pm-setup`; the moved text arrives with the skills in `pm-setup/references/` | `pm-setup` prints the upgrade notes for the versions it crosses; the section's pointer index names every reference file |
| Security and privacy | none found: the script reads local files only and never calls the network; no rule changes meaning, only where it is written | |
| Performance | Sessions with no PM work load about 14,000 tokens less. A PM session reads `rules.md` (and `git.md`, `formats.md`, or `upgrade.md` where the skill cites them) instead, so it saves roughly nothing. The skills trim cuts each run of the five largest skills | Measured before and after by the R-043 report |
| User experience | `pm-help` diagnose gains a Context table and a missing-reference check. Agents in a consumer repository see a short managed section that points to files | Keep the table to one screen; omit it from explain mode |
| Operations and cost | none found: no dependency, no API, GBP 0 | |
| Maintenance | Rules now live in several files, so a skill can cite a rule from the wrong file, and the script's session map can drift | `scripts/validate.ts` fails when a cited reference file is missing and when the section passes 15,000 characters; a test fails when the report's map names a missing skill or file |
| Dependencies | Two rules changes (slices 2 and 3; slice 5 changes `skills/`). While `main` is the unreleased `21.0.0-pre.N` line they may stay on rules 21 (`just bump prerelease`). The same `SKILL.md` files are edited by R-041 ADR skill follow-ups, R-032 pm-checkpoint and pm-lint Note follow-ups, and R-013 Docs-site package: publish and migrate, so merge conflicts follow whichever lands second. Docs site: nothing, because the report is a session diagnosis and the rules are not PM state or a record a user browses | Slice 2 waits for slice 1's baseline; slices 3 and 5 follow in order |
| Reversibility | Reversible: the text moves back into the section with `pm-setup`; the script is read-only | |

## Done when

- Slice 1, R-043: `bun skills/pm-help/scripts/context.ts --root .` prints one line per session type (`always`, `resume`, `claim`, `checkpoint`, `review`) with estimated tokens and the three largest files; a `planning/research/` report records the baseline table; a test fails when the script's map names a missing skill or file; `just lint-check` and `just validate` pass.
- Slice 2: the managed section holds no `Version N` paragraphs, no file-format blocks, and no Committing PM state, Completion rides the branch, Feature branches, PM sync, Pull latest, or PM base bodies; `skills/pm-setup/references/upgrade.md`, `formats.md`, and `git.md` hold them; every `SKILL.md` that cites one names its file; `just validate` fails when a cited reference file is missing; the report's `always` line is at least 6,500 tokens lower than the baseline.
- Slice 3: the managed section is 15,000 characters or less and holds the skill table, the Non-interruption rules, **Read before deciding**, and a pointer index; `skills/pm-setup/references/rules.md` holds the remaining shared rules; `just validate` fails above 15,000 characters; `pm-help` diagnose reports a missing reference file.
- Slice 4: this repository's top part of `AGENTS.md` is 3,000 characters or less and indexes the dedicated files that now hold its content; `just lint-check` and `just validate` pass.
- Slice 5: `pm-export`, `pm-docs-site`, `pm-setup`, `pm-help`, and `pm-checkpoint` `SKILL.md` are each at least 30% smaller, with the moved modes in their `references/`; the report's `claim` and `checkpoint` lines are lower than after slice 3; `just lint-check` passes.
- After all slices, the `planning/research/` report records the before and after table.

## Size and slicing

- Smallest version (answer 2026-11-22): a report script, then one fix: move the 13 `Version N` upgrade notes out of the managed section into a `pm-setup` reference, with the report showing the drop.
- Audience (answer 2026-11-22): shipped in a skill, so consumers can run it on their own install and PM root. Placed in `pm-help` diagnose (Challenges).
- Constraints (answer 2026-11-22): Bun scripts, GBP 0, about 4 hours a week (`VISION.md`). An exact tokenizer was allowed at first, then replaced by a dependency-free estimate (Challenges).
- Size M, one item. Proposed: Serves V2, Milestone none (Later, Unassigned), Owner agent, Depends on none.
- Deferred: a `pm-tidy` archive slice, opened only when the report's PM state line recommends it.
- Reshape 2026-11-24: size L, sliced into 5 in dependency order, each Serves V2, Milestone none (Later, Unassigned), Owner agent:
  1. R-043 Per-session context report (M, depends on none). The upgrade-notes move leaves it for slice 2.
  2. Upgrade, format, and git rules move to references (M, depends on R-043).
  3. Core rules file and a 15 KB managed section (M, depends on slice 2).
  4. Repository AGENTS.md top part into dedicated files (S, depends on none; no rules bump).
  5. Trim the largest SKILL.md files (M, depends on slice 3).

## Open questions

- Which size threshold should make the PM state line recommend a tidy item? Decide in design.
- Where should slice 4 put this repository's instructions (for example `docs/contributing/`)? Decide in its design.
- Which modes of the five largest skills move to `references/`? Decide in slice 5's design, from the report.

## Decision

- 2026-11-22 Added to Later as R-043 Per-session context report and upgrade notes move (Unassigned, M). Why: preventive work with no observed symptom, serving no milestone, while Next is full of M1 and M4 work.
- 2026-11-24 Reshaped to a 15 KB managed section and sliced into 5. Building R-043 Per-session context report now (top of Next); R-046 Upgrade, format, and git rules move to references, R-047 Core rules file and a 15 KB managed section, R-048 Repository AGENTS.md top part into dedicated files, and R-049 Trim the largest SKILL.md files added to Later, Unassigned. Why: the user chose to build it now; the report's baseline gates every later slice.
