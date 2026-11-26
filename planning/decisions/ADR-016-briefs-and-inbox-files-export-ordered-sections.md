# ADR-016 Briefs and inbox files export ordered sections

- Status: proposed
- Date: 2026-11-26
- Category: data
- Supersedes: none
- Item: R-052
- Source: none

## Context

The docs site must show whole briefs and inbox files, and it reads
`planning.json` only. Today the export carries a brief's `problem`,
`doneWhen`, and `decision` first lines and an inbox file's `idea`. ADR-002
exports ADR sections as named Markdown fields.

## Decision

Each brief and inbox entry in `planning.json` gains `sections`: an ordered
array of `{ heading, markdown }`, one per level-2 section after the header
block, in file order. The Markdown is verbatim, with HTML comments stripped
outside code and kept inside it. The existing summary fields stay. The
export moves to `schemaVersion` 6.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| An ordered `sections` list | Keeps every heading, including optional and consumer-added ones; the schema checks shape only | Chosen |
| One named field per heading, as ADRs have | 11 brief and 4 inbox fields; loses an unmodelled heading, as ADR-002 rejected structure | Rejected |
| Summary fields only (do nothing) | No export change, but a brief page adds little beyond Linked from | Rejected by the user (2026-11-26) |

## Consequences

- The export grows by the text of every brief and inbox file.
- The schema, its example, the `pm-export` field map, and `planning.ts`
  change together.
- `@purview-dev/pm-docs-site` reads `schemaVersion` 6 from `0.1.0-pre.7`.
- Follows ADR-002 ADR sections export as Markdown text.
