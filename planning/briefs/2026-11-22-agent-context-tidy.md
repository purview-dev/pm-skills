# Agent context analysis and planning tidy skill

- Status: on roadmap (R-043)
- Origin: planning/inbox/2026-11-22-1232-agent-context-tidy-skill.md
- Updated: 2026-11-22

## Problem

- An agent session loads the managed rules (65 KB) on every start, plus each skill it runs, plus the PM files those skills read. Nothing measures that cost per session type, so growth in the rules, the skills, or the planning state goes unnoticed until it hurts (answer 2026-11-22: both rules and state, measured first).
- Today there is no observed symptom; the work is preventive, against the trend of a section that gains a paragraph with every rules version (answer 2026-11-22).
- Outcome that shows it worked: a per-session token report, one line per session type (for example resume, claim and design, checkpoint, review), whose numbers drop by a set percentage after the fixes (answer 2026-11-22).

## Who and evidence

- Measured 2026-11-22. The managed section (`skills/pm-setup/references/AGENTS-section.md`) is 64.9 KB, roughly 16,000 tokens. It is installed in `AGENTS.md`, which every agent session loads before any skill runs, so every session pays that cost, including sessions that never touch PM work. This repository's `AGENTS.md` is 81.8 KB.
- How the section breaks down: Shared definitions 19.6 KB, Upgrading before work resumes 9.3 KB (of which 13 `Version N` upgrade-note paragraphs only `pm-setup` and an upgrade need), Committing PM state 8.0 KB, Non-interruption rules 7.3 KB, and the rest 2.9 KB or less each.
- Skills load on demand: the 25 `skills/pm-*/SKILL.md` files total 236 KB. The largest are `pm-export` 18.8 KB, `pm-docs-site` 17.5 KB, `pm-setup` 17.4 KB, `pm-help` 15.7 KB, and `pm-checkpoint` 15.0 KB. A single lifecycle session (`pm-resume`, `pm-next`, `pm-checkpoint`) reads three of them on top of the section.
- The PM state files are small. `ROADMAP.md` is 16.1 KB for 15 items, mostly from long `Note:` lines (R-032 and R-042 each hold 10 to 19 findings after the 2026-11-22 review). `LOG.md` is 7.2 KB, and the largest brief is 20.7 KB. `planning.json` (75 KB) and `planning.schema.json` (30.5 KB) are derived, and the Context budget rule says never to read them as state.
- Existing rules already cover reading: **Context budget** (version 13) limits reads to the named files and parts, uses one context per item, and has stage boundaries drop exploration. Nothing yet measures cost, and nothing trims the installed rules or prunes old PM state.
- Not found in `LOG.md` `## Dropped`, `Out of scope` in `VISION.md`, or `Not doing` in `STRATEGY.md`. It overlaps no roadmap item. No accepted ADR covers it (ADR-001 to ADR-003 are about ADR storage and export).

## Original idea

Do a performance analysis to ensure we are agentic token/ context aware. Keep things relevent for agents. This can be a skill for 'tidying up the planning state'

## Proposal

- Add `skills/pm-help/scripts/context.ts`, a dependency-free Bun script that prints estimated tokens (characters / 4) per session type: `always` (the installed managed section), `resume`, `claim`, `checkpoint`, and `review`. Each type is the section plus the named `SKILL.md` files plus the PM files those skills read.
- Give each line its three largest contributors, and a PM state line that recommends a tidy item when `LOG.md`, `ROADMAP.md`, or a brief passes a set size.
- Add a `Context` section to `pm-help` diagnose that runs the script and prints its table.
- Move the 13 `Version N` upgrade notes from the managed section to `skills/pm-setup/references/upgrade-notes.md`. `pm-setup` prints the notes for the versions it crosses.
- Record the report's before and after figures in `planning/research/`.

## Alternatives considered

| Option | Effort | Main benefit | Main cost |
| --- | --- | --- | --- |
| A. Do nothing | none | No rules bump, no new code | Growth in the 65 KB section and in the skills goes unmeasured, and every rules version adds a paragraph to every session |
| B. Repo-only report (characters / 4) plus moving the upgrade notes | S | Measures and cuts this repository's own cost, with no consumer change for the script | Consumers can't measure their own install or PM root |
| C. Report shipped in `pm-help` (diagnose), dependency-free estimate, plus moving the upgrade notes (**recommended**) | M | Every consumer sees the per-session cost of their install and PM root, read-only, in a skill that already diagnoses the setup | A rules bump; the estimate is approximate |
| D. C with an exact tokenizer package | M | Exact counts | Breaks the dependency-free pattern of the shipped scripts (`pm-export`, `pm-lint`, `pm-docs-site` import only `node:` and `bun:`); no offline tokenizer matches current Claude models |
| E. C plus a `pm-tidy` skill that archives `LOG.md`, done briefs, and long Notes | L | Bounds the planning state as projects age | A new shipped skill (4 consumer tables, more skill text to load) for a problem the evidence doesn't show yet (`LOG.md` 7 KB) |
| F. A size cap on the section in `scripts/validate.ts` only | S | Stops growth at no runtime cost | Measures only this repository's section, not sessions, skills, or state |

- Recommended: C. Strongest argument against: a characters / 4 estimate can be off by 20% or more against a real tokenizer, so the absolute numbers are rough. The outcome needs relative drops per session type, and an estimate measures those consistently.

## Challenges and answers

- Exact tokenizer (2026-11-22). Challenge: the shipped scripts in `skills/pm-export/scripts/`, `skills/pm-lint/scripts/`, and `skills/pm-docs-site/scripts/` import only `node:` and `bun:` builtins; no offline tokenizer matches current Claude models, and an exact count needs the API with a key and network. Answer: a dependency-free estimate, labelled `estimated tokens`. Reason: the outcome is relative drops per session type, and the skills stay framework-neutral.
- New skill against pm-help (2026-11-22). Challenge: a new skill adds a row to the README, the managed-section table (always loaded), the `pm-setup` inventory, and the `pm-help` guide, which grows the very cost being measured. Answer: ship it in `pm-help` diagnose. Reason: it is already the read-only setup diagnosis.
- Tidy scope (2026-11-22). Challenge: no evidence yet (`LOG.md` 7.2 KB, `ROADMAP.md` 16.1 KB), and the Context budget rules already limit reads to named parts. Answer: defer it; the report's PM state lines recommend a tidy item once they pass a threshold. Reason: measured first.
- Fit: it serves no `V` line directly. The closest is V2 (`pm-resume` works from `planning/` alone), because a smaller always-loaded section leaves more room in each session. No milestone covers it, so it goes in Later, Unassigned, and delays no item in Next. No conflict with `Out of scope`, `Not doing`, or `## Dropped`.
- Assumption: characters / 4 tracks real token counts closely enough that a change shows in the same direction. Signal that it is wrong: a change the report calls smaller makes sessions compact sooner.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | None in PM state. The upgrade notes move from the managed section to `skills/pm-setup/references/upgrade-notes.md`, so a consumer's `AGENTS.md` loses about 6 KB on the next `pm-setup` | `pm-setup` prints the notes for the versions it crosses; the section keeps one line that points to the file |
| Security and privacy | none found: the script reads local files only and never calls the network | |
| Performance | Every session loads about 6 KB (about 1,500 tokens) less once the notes move; the script runs in well under a second on a small tree | |
| User experience | `pm-help` diagnose gains one section, a table of estimated tokens per session type with the three largest files | Keep it to one table; omit it from explain mode |
| Operations and cost | none found: no dependency, no API, GBP 0 | |
| Maintenance | The script's map of session types to the skills and PM files each reads can drift when a skill's reads change | A test in `just test` fails when the map names a skill or file that does not exist |
| Dependencies | A rules bump (`skills/` changes and the section changes), with a `Version N` upgrade note, which itself now lands in the new file. `scripts/validate.ts` keeps the section equal to its installed copy. Docs site: nothing, because the report is a session diagnosis, not PM state or a record a user browses | |
| Reversibility | Fully reversible: the notes can move back, and the script is read-only | |

## Done when

- `bun skills/pm-help/scripts/context.ts --root .` prints one line per session type (`always`, `resume`, `claim`, `checkpoint`, `review`) with estimated tokens and the three largest files.
- The managed section holds no `Version N` paragraphs, `skills/pm-setup/references/upgrade-notes.md` holds them, and the report's `always` line is at least 1,400 tokens lower than before.
- A `planning/research/` report records the before and after table.
- `just lint-check` and `just validate` pass, with a test that fails when the script's map names a missing skill or file.

## Size and slicing

- Smallest version (answer 2026-11-22): a report script, then one fix: move the 13 `Version N` upgrade notes out of the managed section into a `pm-setup` reference, with the report showing the drop.
- Audience (answer 2026-11-22): shipped in a skill, so consumers can run it on their own install and PM root. Placed in `pm-help` diagnose (Challenges).
- Constraints (answer 2026-11-22): Bun scripts, GBP 0, about 4 hours a week (`VISION.md`). An exact tokenizer was allowed at first, then replaced by a dependency-free estimate (Challenges).
- Size M, one item. Proposed: Serves V2, Milestone none (Later, Unassigned), Owner agent, Depends on none.
- Deferred: a `pm-tidy` archive slice, opened only when the report's PM state line recommends it.

## Open questions

- Which size threshold should make the PM state line recommend a tidy item? Decide in design.

## Decision

- 2026-11-22 Added to Later as R-043 Per-session context report and upgrade notes move (Unassigned, M). Why: preventive work with no observed symptom, serving no milestone, while Next is full of M1 and M4 work.
