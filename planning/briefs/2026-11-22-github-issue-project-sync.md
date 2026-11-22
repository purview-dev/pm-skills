# GitHub issue and Project sync

- Status: parked
- Origin: planning/inbox/2026-11-22-1739-github-issue-project-sync.md
- Updated: 2026-11-22

## Problem

- Bug reports and requests filed as GitHub issues, on purview-dev/pm-skills or on a consumer's repository, never reach `planning/`. They have to be copied in by hand, and some are lost (answers 2026-11-22).
- Direction: one-way inbound. Each GitHub issue becomes an inbox file, triaged by `pm-review` like any other capture. `planning/` stays the only state, and nothing is written back to GitHub (answer 2026-11-22).
- Where issues are lost: in consumer repositories that use pm-skills, not in this one (answer 2026-11-22).
- Smallest version: an import step in `pm-review` that lists open issues whose URL no inbox file holds, and parks the ones the user chooses (answer 2026-11-22).
- Write back: nothing on GitHub. The import is read-only, and closing an issue stays manual (answer 2026-11-22).
- Scope: issues only, with no GitHub Project board (answer 2026-11-22). Because nothing publishes outward, the idea does not conflict with `Out of scope` (no shared hosted board).

## Who and evidence

- No skill syncs with GitHub. The only GitHub reference in `skills/` is `skills/pm-discover/SKILL.md` line 36, which may read a source such as `gh issue list` after asking the user. Nothing writes issues or Project items.
- Possible conflict with `Out of scope for v1` in `VISION.md` line 27: "Teams and shared boards: multi-user assignment, permissions, or a shared hosted board. PM state is files in one repository." A GitHub Project kept in sync with the roadmap is a shared hosted board.
- Related lines in `STRATEGY.md` `Not doing`: "Writing PM state from the site" (PM state changes only through the pm-* skills) and "Hosting the docs site" (revisit after M1).
- PM skills never push or touch anything outside the PM root (Non-interruption rule 6). Creating or editing an issue is an outward-facing write to an external service, which no skill does today.
- The derived `planning/planning.json` (schemaVersion 5) already holds every item, milestone, and status in one schema-validated document, which is the natural source for a one-way export.
- `gh` is installed on this machine, and the repository's remote is `https://github.com/purview-dev/pm-skills`.
- Checked 2026-11-22 with `gh issue list --repo purview-dev/pm-skills --state all`: the repository has issues enabled and has never had an issue (0 open, 0 closed). Whatever evidence of lost issues exists comes from other repositories, not this one.
- `pm-discover` already reads a source like `gh issue list` after asking, and parks the opportunities it chooses, so a one-off import is partly possible today, through discovery.
- The **Inbox file** format already has `## Links` (an issue URL can go there) and `Source: user | agent`, but no `github` source. A repeat import needs a key, such as the issue URL in `## Links`, so it never parks the same issue twice.
- `pm-lint` rule `inbox/fields` (`skills/pm-lint/references/rules.md` line 195) allows `Source` to be only `user` or `agent (<skill or item and stage>)`. The export schema types inbox `source` as free text. A new `Source: github` value would therefore change the lint rule, the Shared definitions, and a test.
- Not found in `LOG.md` `## Dropped` or `ROADMAP.md`. No accepted ADR covers it.

## Original idea

GitHub issue / Project sync

## Proposal

- A `config.md` setting `Issue import: <command> | none` (default `none`), written by `pm-init` and asked for by `pm-setup` on upgrade.
- A `pm-review` step before inbox triage: run the command, drop issues whose URL an inbox file already links, and ask one multi-select question about which to park.
- Each chosen issue becomes an inbox file with `Source: user`, the issue title and body verbatim under `## Idea`, and its URL in `## Links`.
- Read-only on GitHub: no labels, comments, or closes.

## Alternatives considered

| Option | Effort | Main benefit | Main cost |
| --- | --- | --- | --- |
| A. Do nothing | none | No change. `pm-discover` can already read `gh issue list` on request and park what it finds | Issues are missed unless someone runs discovery; nothing remembers which issues were already parked |
| B. `pm-park` from one issue (`pm-park #42`) | S | On demand, one issue at a time, no new setting | The user still has to notice each issue on GitHub, which is the step that loses them |
| C. Import step in `pm-review`, gated by an `Issue import` setting in `config.md` (**recommended**) | M | Every review lists the open issues not yet parked (deduplicated by the issue URL in `## Links`), and the user picks which to park; read-only on GitHub | A rules bump, plus a new setting that `pm-setup` asks for on upgrade; it needs `gh` and network at review time |
| D. Scheduled GitHub Action that writes inbox files | M | Fully automatic | Runs outside the agent, commits to the repository (no PM skill commits from CI), and is GitHub-only infrastructure in every consumer |
| E. Two-way sync with a GitHub Project | L | Full visibility on GitHub | Conflicts with `Out of scope` (a shared hosted board), and creates a second state system, which the Bug definition forbids |

- Recommended: C. Strongest argument against: there is no measured evidence. This repository has 0 issues, and the consumer losses are reported, not counted, so a rules bump and a setting may be spent on a channel that stays quiet.

## Challenges and answers

- Evidence (2026-11-22). Challenge: `purview-dev/pm-skills` has never had an issue. Answer: the issues are lost in consumer repositories. Reason: the feature serves consumers, so this repository is not where to look for evidence.
- Source field (2026-11-22). Challenge: `inbox/fields` allows only `user` or `agent (...)` as `Source`. Answer: `Source: user`, with the issue URL in `## Links` and the issue title and body verbatim under `## Idea`; the URL is the key that stops an issue being parked twice. Reason: no change to the file format, the lint rule, or the docs site.
- Gating (2026-11-22). Challenge: `gh` is GitHub-only, and the skills are framework-neutral. Answer: a setting in `config.md`, `Issue import: <command> | none`, default `none`, which `pm-setup` asks for on upgrade. The step is skipped when the setting is `none` or the command is missing, and an offline run adds a `Note`. Reason: config holds the integrations, and the command can be `glab` or another tool.
- Fit (2026-11-22). Challenge: no V line (V1 to V5) covers capture from outside, and an item needs `Serves`. Answer: park it until after v1. Revisit when a consumer reports a lost issue, or when v1 is done. Reason: a stretch of V2, or a new V line, is not worth it before the current milestones.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | New `Issue import` setting in `config.md`; existing installs lack it | `pm-setup` asks on upgrade; a missing setting means `none` |
| Security and privacy | Issue bodies from the public are written verbatim into `planning/inbox/` and read by agents, which is a prompt-injection path into the PM state | Treat imported text as data: `pm-review` shows it and the user picks; the Idea is quoted and never acted on as an instruction |
| Performance | One `gh` call per review; slow or offline networks delay the review | Time out, and skip with a `Note` |
| User experience | One multi-select question per review listing new issues | Only when the setting is on and there are unparked issues |
| Operations and cost | `gh` must be installed and authenticated; GBP 0 | Skipped when missing |
| Maintenance | `pm-review`, `pm-setup` (the setting), `pm-help` (diagnosis), the `pm-init` config template, and the managed section change together | One rules bump |
| Dependencies | Docs site: nothing new, because imported issues are ordinary inbox files that the Inbox view already lists, with their Links. No roadmap item depends on it | |
| Reversibility | Set `Issue import: none`; imported inbox files remain as normal captures | |

## Done when

- With `Issue import: gh issue list --state open --json number,title,body,url`, `pm-review` in a scratch repository lists only the open issues not already linked from an inbox file, and parks the chosen ones as inbox files that pass `pm-lint check`.
- With `Issue import: none`, or without `gh`, `pm-review` runs unchanged and prints no question.
- `just lint-check` and `just validate` pass.

## Size and slicing

- Size M, one item, a rules bump. If it is reopened: Serves a new or revised V line (decided with `pm-strategy`), Milestone none, Owner agent, Depends on none.

## Open questions

- Should imported issue text be fenced or quoted under `## Idea` to mark it as untrusted input? Decide in design.

## Decision

- 2026-11-22 Kept parked. Why: no V line covers capture from outside, and there is no measured evidence yet (0 issues on this repository). Revisit when a consumer reports a lost issue, or when v1 is done.
