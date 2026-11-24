# ADR-008 Context cost is estimated as characters / 4

- Status: accepted
- Date: 2026-11-24
- Category: tooling
- Supersedes: none
- Item: R-043
- Source: none

## Context

The context report (`skills/pm-help/scripts/context.ts`) measures the cost of each session type, so R-046 to R-049 can cut the managed section and trim the skills against a baseline. The shipped scripts import only `node:` and `bun:` builtins, and no offline tokenizer matches current Claude models. Spec: `docs/superpowers/specs/2026-11-24-per-session-context-report-design.md`.

## Decision

Estimate tokens as `ceil(characters / 4)` on LF-normalised text, labelled `estimated tokens`, and compare the relative change per session type, not absolute numbers.

## Alternatives

- An exact tokenizer package: breaks the dependency-free scripts, and none matches current Claude models.
- The token-counting API: needs a key and the network.
- Do nothing: growth stays unmeasured.

## Consequences

- Absolute numbers may be off by 20% or more; relative drops are measured consistently.
- No dependency, works offline, costs GBP 0.
