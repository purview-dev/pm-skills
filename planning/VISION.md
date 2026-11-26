# Vision

<!-- Written by pm-init. Changed only by pm-strategy (vision mode), with user approval and a Decisions line in STRATEGY.md. -->

## Problem

- A solo developer using AI coding agents loses track of what to build next, why, and where work stopped, because agents forget between sessions and act on every idea at once.

## Customer

- A solo developer, or a very small team, who builds with AI coding agents such as Claude Code, Copilot, or Codex, and installs skills into their repositories.

## v1 is done when

<!-- Observable outcomes. Each roadmap item must serve at least one line. -->

- V1: `npx skills add https://github.com/purview-dev/pm-skills -y` followed by `pm-setup` leaves a repository with the rules merged, and every pm-* skill and every workflow skill reported installed.
- V2: After compaction or a new session, `pm-resume` names the active item, its stage, and the next action from `planning/` alone.
- V3: During an active workflow, only the Non-interruption rules' exceptions run (capture, `pm-checkpoint` stage, done, push and pop, `pm-pause`, `pm-revise`, and the read-only views and checks); every other PM skill waits, and a capture replies in one line while the step in progress resumes.
- V4: `pm-export` writes a schema-valid `planning.json`, and `pm-docs-site` builds a site from it whose `just docs-check` passes.
- V5: Technical decisions are recorded and followed: `pm-engineering` records the technology and principles in use, the design handoff names the ADRs and principles that apply, and `pm-checkpoint` (`done`) refuses to close an item whose command checks fail.

## Out of scope for v1

<!-- Anything here is parked automatically, without discussion. -->

- Teams and shared boards: multi-user assignment, permissions, or a shared hosted board. PM state is files in one repository.
- Non-Bun tooling: npm- or pnpm-only toolchains for validation and the docs site.

## Constraints

- Time available: about 4 hours per week
- Budget: GBP 0 per month (no paid services)
- Stack: Markdown skills, Bun scripts, just, markdownlint-cli2, GitHub Actions
