# Studios with several locations

- Status: on roadmap (R-013)
- Origin: user request
- Updated: 2026-11-12

## Problem

- A studio with a second location runs two Slotwise accounts and two calendars.

## Who and evidence

- One pilot opened a second room across town in November and asked for one account.

## Original idea

One studio account with many locations, each with its own rooms, hours, and timezone.

## Proposal

- A location owns rooms, opening hours, and a timezone.
- Clients pick the location before the class.

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing | none | No work. | Two accounts per studio. |
| **Locations inside one account (recommended)** | M | One dashboard and one client list. | Every query gains a location filter. |
| Linked accounts | S | Little code. | Clients see two studios. |

## Challenges and answers

- 2026-11-12. Claim: per-location timezones need R-011 first. Answer: R-013 depends on R-011.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | A location column on rooms and classes. | Backfill one location per studio. |
| Security and privacy | none found | |
| Performance | none found | |
| User experience | One more choice when booking. | Skip it for single-location studios. |
| Operations and cost | none found | |
| Maintenance | Location filters on every query. | |
| Dependencies | Depends on R-011; R-014 depends on it. | |
| Reversibility | Reversible while one location exists. | |

## Done when

- An owner adds a second location with its own rooms, hours, and timezone, and clients choose the location when they book.

## Size and slicing

- Size M, one item.

## Open questions

- none

## Decision

- 2026-11-12 Add to Later under M3. Why: it serves V4, and M2 comes first.
