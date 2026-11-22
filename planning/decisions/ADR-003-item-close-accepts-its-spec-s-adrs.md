# ADR-003 Item close accepts its spec's ADRs

- Status: accepted
- Date: 2026-11-22
- Category: architecture
- Supersedes: none
- Item: R-039
- Source: none

## Context

The design stage records each architecture decision with `pm-adr new` as `proposed`, and nothing moved it to `accepted`, so proposed ADRs piled up whether or not the work that carried them was built. Other skills (`pm-review`, `pm-purview`, `pm-revise`) also need to change ADRs, and the ADR record is written only by `pm-adr`.

## Decision

`pm-checkpoint` (`done`) reads the ADR IDs the item's spec names, refuses to close when one has no file, and runs `pm-adr accept` on each named ADR that is still `proposed` and whose `Item` is the closing item (or that supersedes, through `pm-revise`, an ADR the spec names), changing only its `Status` line on the item's branch inside the Completion record commit. `proposed` therefore means a decision not yet built. Every skill that changes an ADR applies a `pm-adr` mode's write steps, without that mode's output or commit; the calling skill's PM commit covers the ADR files.

## Alternatives

- Do nothing: ADRs stay `proposed` until the user runs `pm-adr accept`; the status says nothing about whether the decision shipped.
- List the proposed ADRs in `done`'s Note and leave them proposed: no automatic change, but they accumulate for `pm-review`.
- Ask once at close: most control, one more question at every close.
- Chosen: accept at close, because the spec was approved and its `Done when` checks passed. Strongest argument against: an ADR the spec names only in passing is accepted without a separate look.

## Consequences

- `pm-review` and `pm-help` only see proposed ADRs that no closed item carried.
- An unmerged completion that `pm-revise` reverses leaves its ADRs accepted; a reversed decision is superseded, never set back to `proposed`.
