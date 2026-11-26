# ADR-013 Principles are matched and checked in prose

- Status: accepted
- Date: 2026-11-25
- Category: architecture
- Supersedes: none
- Item: R-036
- Source: none

## Context

`ENGINEERING.md` (ADR-009) records principles with `Applies to` globs and `Check: <command> | review`, but no stage reads them. The plan stage needs the principles that apply to the spec's files, and the item close needs to check the changed files against them (brief `planning/briefs/2026-11-20-technology-and-engineering-principles.md`). Spec: `docs/superpowers/specs/2026-11-25-plan-citation-and-done-check-design.md`.

## Decision

The skills match `Applies to` against paths and run the checks from their own text, with no script. **Every plan handoff** lists the ADRs the spec names and the principles whose `Applies to` is `all` or matches a path the spec names. `pm-checkpoint` (`done`) matches the principles against `git diff --name-only <PM base>...HEAD`, runs each matching command check before writing anything (a failure keeps it in `pause`), and reviews the `review` principles, writing each break as a `Note` and an inbox file without blocking.

## Alternatives

- A `pm-engineering check` mode backed by a Bun script that matches and runs the checks: deterministic and tested, but a script, tests, and a mode to maintain. Recommended by the agent; not chosen by the user (2026-11-25).
- A done-only script in `pm-checkpoint`: deterministic at close, while the plan handoff still matches by hand, so the two can disagree.
- Do nothing: the principles stay unread by every stage.

## Consequences

- Two runs can select different principles for the same files, because the agent matches globs by hand. A script can replace the matching later without changing the rules.
- A failing command check blocks the close; a review finding never does.
- No new code, tests, or `pm-lint` rules.
