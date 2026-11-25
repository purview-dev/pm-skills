# ADR-009 Engineering file records state, ADRs reasons

- Status: accepted
- Date: 2026-11-24
- Category: architecture
- Supersedes: none
- Item: R-034
- Source: none

## Context

A repository's adopted technology and engineering principles are not recorded in PM state, so agents build items that break them (brief `planning/briefs/2026-11-20-technology-and-engineering-principles.md`). Since ADR-001, technical decisions (technology, library, pattern) live in ADRs, so a second record of why a technology was adopted would drift from its ADR. Spec: `docs/superpowers/specs/2026-11-24-engineering-file-and-pm-engineering-skill-design.md`.

## Decision

`<PM root>/ENGINEERING.md`, owned only by `pm-engineering`, records the current state: the technology in use (`### <Name>` blocks) and the principles work must follow (`### EP-NNN <Title>` blocks, IDs never reused). Each entry carries a one-line `Reason` and a `Decision: ADR-NNN | none` field; the full why and its alternatives stay in the ADR. A removed entry leaves one line under `## Removed`.

## Alternatives

- Entries carry their own full reasons, no ADR link: simpler, but duplicates the ADRs and drifts from them.
- Principles only, technology in ADRs alone: an ADR records a decision, not what is in use now, and the Done when of R-034 needs `## Technology`.
- Do nothing: choices stay in `AGENTS.md` and agent memory, unread by any stage.

## Consequences

- One place answers "what do we use and what must we follow"; ADRs keep answering "why".
- Entries without an ADR (`Decision: none`) are allowed, so older choices can be recorded without writing an ADR first.
- `pm-lint` checks that a `Decision` names an existing ADR.
