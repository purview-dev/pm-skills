# Decisions

Architecture decision records (ADRs): one technical decision
(architecture, technology, library, or pattern) per file, written only by
`pm-adr`. Product decisions (whether and what) stay in `STRATEGY.md` and
briefs; one item's detail lives in its spec, which names the ADR IDs it
writes or follows.

File name: `ADR-NNN-<slug>.md`, IDs `ADR-NNN` (at least 3 digits), never
reused. An accepted ADR is never rewritten: a change is a new ADR that
supersedes it, and the old file's `Status` becomes
`superseded by ADR-NNN`.
