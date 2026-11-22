# ADR-003 Store class times in UTC

- Status: accepted
- Date: 2026-11-16
- Category: data
- Supersedes: ADR-002
- Item: R-011
- Source: none

## Context

R-011 shows each confirmation in the studio's timezone, and R-013 adds
studios with locations in more than one timezone. Local times stored by
ADR-002 are ambiguous across daylight-saving changes.

## Decision

Store each class's start in UTC with the studio's IANA timezone name, and
convert to the studio's local time when it is shown.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| UTC and the timezone name | One conversion on display | Chosen |
| Local time with an offset | Breaks for repeating classes across a daylight-saving change | Rejected |

## Consequences

- A one-off migration converts the stored times with each studio's timezone.
- Every display path calls the same `formatClassTime` helper.
