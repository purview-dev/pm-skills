# Roadmap

<!--
IDs are R-NNN, never reused. A new ID is the highest number in ROADMAP.md,
NOW.md, and LOG.md, plus 1. pm-next takes the first claimable item in Next:
Status ready or paused, Owner agent or both, every Depends on ID done.
Owner user items are done by the user and closed with pm-item done.
Position is the order of the item blocks: Next is the claim order; Later is
grouped by milestone in STRATEGY.md order. Move, add, and insert with
pm-item, pm-board, or pm-roadmap (rules: Roadmap order and edits).
-->

## Next

<!-- Ordered. Maximum is set in config.md. -->

### R-008 Cancellation policy per studio

- Serves: V2
- Milestone: M2
- Owner: agent
- Done when: a client who cancels inside the studio's notice window is charged the studio's late fee, and the dashboard shows the charge.
- Size: S
- Depends on: R-007
- Status: ready

### R-009 Waitlist for full classes

- Serves: V1
- Milestone: M2
- Owner: agent
- Done when: a client joins the waitlist of a full class and gets the slot by email within a minute of a cancellation.
- Size: M
- Depends on: none
- Status: paused
- Paused checkpoint: 2026-11-12 Stopped at Task 2 of 4 (the waitlist table exists). Next action: send the slot email on cancellation.

### R-010 Write the pricing page copy

- Serves: V2
- Milestone: M2
- Owner: user
- Done when: the pricing page states the monthly price and the card fee, and the copy is approved.
- Size: S
- Depends on: none
- Status: ready

### R-011 Confirmations show the studio's timezone

- Serves: V3
- Owner: agent
- Done when: a booking at a Lisbon studio sends a confirmation that shows the time in Europe/Lisbon.
- Size: S
- Depends on: none
- Status: ready
- Revisits: R-003
- Note: From the 2026-11-10 decision (STRATEGY.md): A3 One timezone per studio is broken.

### R-012 Two-way calendar sync

- Serves: V1
- Milestone: M2
- Owner: both
- Done when: a booking appears in the instructor's Google Calendar within five minutes, and a calendar block closes the slot.
- Size: M
- Depends on: none
- Status: blocked (Waiting for Google API verification, since 2026-11-12)

## Later

<!-- Grouped by milestone where one is set. Same item format. -->

### R-016 Retry failed card payments

- Serves: V2
- Milestone: M2
- Owner: agent
- Done when: a declined card is retried once after 24 hours, and the client gets one email with a link to pay.
- Size: S
- Depends on: R-007
- Status: ready

### R-013 Studios with several locations

- Serves: V4
- Milestone: M3
- Owner: agent
- Done when: an owner adds a second location with its own rooms, hours, and timezone, and clients choose the location when they book.
- Size: M
- Depends on: R-011
- Status: ready
- Brief: planning/briefs/R-013-several-locations.md

### R-014 Staff accounts and roles

- Serves: V4
- Milestone: M3
- Owner: both
- Done when: an owner invites an instructor who can see their own classes and nothing else.
- Size: M
- Depends on: R-013
- Status: ready

### R-015 Dark theme for the booking page

- Serves: V1
- Owner: agent
- Done when: the booking page follows the device's dark setting and passes a contrast check.
- Size: S
- Depends on: none
- Status: ready
