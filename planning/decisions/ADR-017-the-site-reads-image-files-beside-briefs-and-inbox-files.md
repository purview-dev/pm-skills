# ADR-017 The site reads image files beside briefs and inbox files

- Status: accepted
- Date: 2026-11-26
- Category: architecture
- Supersedes: none
- Item: R-052
- Source: none

## Context

ADR-012 lets the site read the image files beside an ADR in
`<PM root>/decisions/`. Brief and inbox pages render their sections the
same way, and a section may reference a relative image.

## Decision

`brief-sections` and `inbox-sections` content collections render each
section once with `renderMarkdown`, resolving relative images against
`briefs/<file>` or `inbox/<file>` beside the configured `planning.json`.
Linked from keys come from the same rendered HTML, as ADR-015 does for
ADRs. Every PM record is still read only from `planning.json`. A missing
image file fails the build.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Extend the ADR pipeline to briefs and inbox files | Same fidelity and link guarantees as ADR pages; two more collections | Chosen |
| Plain text through `LinkedText` | Cheaper; lists and tables flatten | Rejected |
| Read the brief and inbox Markdown files directly | Breaks the rule that the site reads the export only | Rejected |

## Consequences

- Two more content collections, each empty when its view is off.
- Extends ADR-012 to two more folders without superseding it.
- Follows ADR-012 The site reads image files beside an ADR and ADR-015 ADR
  page references come from adr-sections.
