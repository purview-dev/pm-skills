# ADR-001 ADRs live in the PM root

- Status: accepted
- Date: 2026-11-22
- Category: architecture
- Supersedes: none
- Item: R-033
- Source: none

## Context

Technical decisions (why this library, why this pattern) were buried in
each item's design spec, so they were not findable later, and agents built
items that contradicted them. ADRs needed a home and an owner so they
become checkable, linted, and read before a new technical decision is
made.

## Decision

Architecture decision records live at `<PM root>/decisions/`, one file per
decision, owned by a new skill, `pm-adr`. ADRs are PM state: the same write
boundary as every other PM file (main worktree only, linted by `pm-lint`
and committed by PM commits; exported in a later slice). An existing
outside ADR folder (for example `docs/adr/`) is imported into the
decisions folder with `pm-adr import`, never managed in place.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| `docs/adr/` written by the design stage, a config setting points at it | No PM ownership; a managing skill would break the PM-root-only write rule | Superseded by the user's choice |
| `docs/adr/` with a rule-6 exception for `pm-adr` | Keeps ADRs beside the code; a second write boundary to explain and guard | Rejected |
| `<PM root>/decisions/`, owned by `pm-adr` | Same boundary as every PM file; linted, exported, committed by PM commits; an existing outside folder is imported, not managed in place | Chosen |

## Consequences

- ADRs are PM state: linted (`adr/*` rules), exported in a later slice, and
  committed only by PM commits, never by `pm-adr` itself during a workflow.
- A skill (`pm-adr`) is the only writer; an accepted ADR is never rewritten,
  only superseded or deprecated.
- An existing outside ADR folder is never managed in place; `pm-adr import`
  copies it into the decisions folder once, and the originals stay.
- This reverses the earlier `docs/adr/` and `ADR directory` setting
  decisions recorded in the brief.
