# Where do ADRs fit in

- Status: on roadmap (R-033), active
- Origin: planning/inbox/2026-11-22-0952-where-do-adrs-fit.md
- Updated: 2026-11-22

## Problem

- Technical decisions (why this library, why this pattern) are buried in each item's design spec and are not findable later, by the user or by an agent (answer 2026-11-22).
- Agents then build items that contradict earlier architecture decisions, because nothing points them at the record (answer 2026-11-22).
- Scope: ADRs record technical decisions only (architecture, technology, patterns). Product decisions stay in `STRATEGY.md` `## Decisions` and briefs (answer 2026-11-22).

## Who and evidence

- No ADR exists in this repository and no pm-* skill mentions ADRs. The only reference is `.config/purview-docs.yml` line 1, which cites ADR 0013 in the purview.dev site repository, so the user already keeps ADRs elsewhere.
- Decisions are recorded today in three places, none of them an ADR: `STRATEGY.md` `## Decisions` (product decisions, each with `Why` and `Rejected`), each brief's `## Alternatives considered`, `## Challenges and answers`, and `## Decision` (whether and what), and the design specs in `docs/superpowers/specs/` (18 files, how), written by the `design` handoff in `planning/config.md`.
- The "technology/ stack" in the question matches the parked brief `planning/briefs/2026-11-20-technology-and-engineering-principles.md`, which proposes `ENGINEERING.md` with `## Technology` and `## Principles`, each entry citing a `Source`. An ADR is a natural `Source` for an adopted technology or principle.
- `pm-docs-site` has an `architecture` module (LikeC4 views) and a `repo-docs` module (`docs/` pages): `skills/pm-docs-site/templates/architecture/MODULE.md`. ADRs in `docs/` would render through `repo-docs` without new code.
- PM skills never write specs, plans, or code (Non-interruption rule 6), so an ADR file outside the PM root could not be written by a PM skill; only the workflow could write it.
- Not found in `LOG.md` `## Dropped`, `ROADMAP.md`, `Out of scope` in `VISION.md`, or `Not doing` in `STRATEGY.md`.

## Original idea

Where do ADRs fit in to the overall project? Given we also make use of a technology/ stack.

## Proposal

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing: decisions stay inside each spec in `docs/superpowers/specs/` | none | No rules bump | Technical decisions stay unfindable; agents keep contradicting them |
| Smallest: one managed-rules line naming `docs/adr/` as the ADR home, no setting | S | Every session, in or out of the lifecycle, is told where ADRs are | Hard-codes a path; consumers with `docs/decisions/` or none get a wrong pointer |
| ADR setting and handoff (recommended): `ADR directory: <path> \| none` in `config.md`; `pm-next` tells the design skill to read the ADRs and write one per architecture decision; the managed rules point every session at the directory; `pm-init` and `pm-setup` detect or ask for it; `pm-help` reports it | M | Findable record per consumer; design reads and writes it; ad-hoc sessions read it too | Rules bump; touches `pm-init` template, `pm-setup`, `pm-next`, `pm-help`, managed section, `pm-lint` config schema |
| PM-owned ADRs in `planning/decisions/` with a `pm-*` skill | L | Linted, exported, shown on the docs site | Puts "how" in the PM layer; a new skill and schema; rejected by the user (2026-11-22) |

Recommended: ADR setting and handoff. Strongest argument against: the design skill (`superpowers:brainstorming`) is not this repository's code, so "write an ADR" is an instruction in the handoff, not a guarantee; an item can still close without its ADR.

## Challenges and answers

- 2026-11-22 Where ADRs live and who writes them. Answer: `docs/adr/` (configurable), written by the design stage, not by a PM skill; PM skills only point at them (Non-interruption rule 6 keeps PM writes inside the PM root).
- 2026-11-22 Relation to the parked technology and engineering principles brief. Answer: a standalone item; `ENGINEERING.md`, if built later, cites ADRs as its `Source`.
- 2026-11-22 Reach. Claim: `pm-next` step 10 is the only place the design skill is briefed, so an agent working outside the lifecycle never sees the ADRs. Mitigation: the managed rules carry one line pointing every session at the `ADR directory`. Not put to the user: it follows from problem 2.
- 2026-11-22 Fit. Claim: none of V1 to V4 in `VISION.md` and none of M1 to M3 in `STRATEGY.md` covers it; M1 Reproducible docs site is the focus, and the engineering-principles brief was parked for the same reason on 2026-11-20. SCOPE CHANGE to v1. Answer: park it; `pm-strategy` adds a `V` line (for example, agents follow recorded technical decisions) and a milestone after M1 that covers this brief and the engineering-principles brief.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | New `ADR directory` setting in `config.md`; older installs have none | A missing setting means `none`; `pm-setup` detects `docs/adr/` or `docs/decisions/` on upgrade and asks once |
| Security and privacy | none found | none |
| Performance | The design stage reads the ADR directory on every claim | Pass the directory path, and tell the design skill to read the index or titles first, not every ADR |
| User experience | One more record beside `STRATEGY.md` Decisions, briefs, and specs | The managed rules state the split: product decisions in `STRATEGY.md` and briefs, technical decisions in ADRs, per-item detail in specs |
| Operations and cost | none found | none |
| Maintenance | Rules bump; `pm-init` template, `pm-setup`, `pm-next`, `pm-help`, managed section, and the `pm-lint` config schema change | One item, one rules version; each rule changes with its test (AGENTS.md) |
| Dependencies | The parked engineering-principles brief would cite ADRs as `Source`; no open roadmap item depends on it | Built first or alongside that brief's slice 1 under the same milestone |
| Reversibility | ADRs are ordinary files in `docs/`; removing the setting leaves them readable | Revert the rules version |

## Done when

- `pm-init` in a scratch repository with `docs/adr/` writes `ADR directory: docs/adr/` to `planning/config.md`, and `pm-lint check` passes.
- `pm-next` step 10's handoff names the ADR directory and tells the design skill to read it and to write one ADR per architecture decision its spec makes.
- The managed section names the `ADR directory` and the product / technical / spec split, and `just validate` passes.
- `pm-help` reports `ADR directory: none` as a diagnosis with `pm-setup` as the fix.

## Size and slicing

Size M, one slice. Proposed: Serves a new `V` line (to be written by `pm-strategy`), Milestone a new milestone after M1 shared with the engineering-principles brief, Owner `agent`, Depends on none.

## Open questions

- The `V` line and milestone this serves: decided by `pm-strategy`.
- ADR template and numbering (for example MADR, `NNNN-<slug>.md`): decided in the design stage, or detected from an existing directory.

## Decision

- 2026-11-22 Keep it parked. Reason: SCOPE CHANGE to v1; no `V` line or milestone covers it and M1 Reproducible docs site is the current focus. Answer to the question: ADRs record technical decisions only, live in a configurable `docs/adr/`, are written by the design stage, and are read by every session through the managed rules. Next: `pm-strategy` adds a `V` line and a milestone after M1 covering this and the engineering-principles brief.
- 2026-11-22 Added to Next as R-033 ADR directory setting and design handoff (M4 Recorded technical decisions, serves V5), through pm-strategy.

## Revisions

- 2026-11-22 ADRs were to live in a configurable `docs/adr/`, recorded by an `ADR directory` setting. Must now: live in `<PM root>/decisions/`, written only by the new `pm-adr` skill and linted by `pm-lint`; the `ADR directory` setting and the `docs/adr/` default are dropped, and `pm-adr import` brings an existing folder in (user, 2026-11-22). Mode: fix-in-place. Supersedes: the `Done when` above and R-033's old title.
