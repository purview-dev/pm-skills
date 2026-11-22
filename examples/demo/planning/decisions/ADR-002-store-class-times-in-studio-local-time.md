# ADR-002 Store class times in studio local time

- Status: superseded by ADR-003
- Date: 2026-10-12
- Category: data
- Supersedes: none
- Item: none
- Source: none

## Context

Every pilot studio was in one timezone, and the timetable is entered in
local time.

## Decision

Store each class's start as the studio's local date and time.

## Alternatives

Store UTC and convert on display: more work for one timezone.

## Consequences

- Confirmation emails print the stored time as it is.
