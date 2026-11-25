# ADR-014 Purview packages are recorded at item close

- Status: proposed
- Date: 2026-11-25
- Category: architecture
- Supersedes: none
- Item: R-036
- Source: none

## Context

`pm-purview` turns an accepted recommendation into a roadmap item and a proposed ADR, but the package is not installed until that item is built. `ENGINEERING.md` records the technology in use (ADR-009), and `pm-engineering add` asks for evidence that it is in use and cannot run during a workflow. Spec: `docs/superpowers/specs/2026-11-25-plan-citation-and-done-check-design.md`.

## Decision

`pm-purview` writes `Purview package: <PackageId>.` in the accepted item's `Note` and nothing in `ENGINEERING.md`. When that item closes, `pm-checkpoint` (`done`) finds the package in the item branch's manifests and applies `pm-engineering` `add technology` write steps only, with `Source` the manifest path and `Decision` the item's ADR it has just accepted. `ENGINEERING.md` is read from the PM base and written in the item's worktree, so the entry rides the pull request.

## Alternatives

- Record at acceptance in `pm-purview`: simplest, but lists a package before it is installed, and stays wrong when the item is dropped. Rejected by the user (2026-11-25).
- `pm-purview` output tells the user to run `pm-engineering add` later: no automation, easily forgotten.

## Consequences

- `ENGINEERING.md` lists only packages found in a manifest.
- `pm-checkpoint` (`done`) gains a second write it applies on another skill's behalf, after `pm-adr accept` (ADR-010).
- An uncommitted `ENGINEERING.md` stops `done` like `ROADMAP.md`; it is not a capture.
