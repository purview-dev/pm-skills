# ADR-001 Use Bun for scripts

- Status: superseded by ADR-002
- Date: 2026-10-20
- Category: tooling
- Supersedes: none
- Item: none
- Source: none

## Context

Scripts ran on **Node** with `ts-node`, which was slow to start.

## Decision

Run every script with Bun.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Bun | Fast start, built-in tests | Chosen |
| Node with `ts-node` | Slow start | Rejected |

## Consequences

- Contributors install Bun.
