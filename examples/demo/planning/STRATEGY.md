# Strategy

<!--
Written by pm-strategy, one approved section at a time. Read by pm-next,
pm-review, pm-shape, pm-discover, pm-status, pm-board, pm-roadmap, and
pm-up-next. VISION.md says what v1 is;
this file says the order of attack, the bets behind it, and the decisions
made along the way.
-->

## Current focus

- Milestone: M2
- Why now: the eight pilot studios book through Slotwise every day, and five of them asked to take payment at booking (LOG.md, 2026-11-18).

## Milestones

### M1 Bookable calendar

- Serves: V1, V3
- Exit criteria: a pilot studio takes 50 bookings in one week with no double booking.
- Target: 2026-10-30
- Status: done (2026-11-03)

### M2 Paid bookings

- Serves: V2, V3
- Exit criteria: three pilot studios take card payments at booking for two weeks.
- Target: 2026-12-18
- Status: active

### M3 Studios that grow

- Serves: V4
- Exit criteria: a studio with two locations and three staff runs a week without support.
- Target: 2027-02-26
- Status: planned

## Bets

- B1: We believe taking payment at booking will cut no-shows by half for pilot studios.
  Evidence: two pilots that ask for a deposit by bank transfer report 4% no-shows against 11% for the rest. We will know when: no-shows in the dashboard fall below 6% for paying studios.
  Status: open
- B2: We believe a ten-minute setup checklist will let owners onboard alone.
  Evidence: the last three pilots needed a call only to set opening hours. We will know when: two studios finish setup without contacting us.
  Status: won (2026-11-14)

## Assumptions and risks

- A1: Studios accept a 1.5% card fee on top of the monthly price. Test: ask the eight pilots before R-007 Online payments at booking ships. Status: holds (2026-11-12)
- A2: Clients book mostly on phones. Test: check the device split after 500 bookings. Status: untested
- A3: One timezone per studio is enough. Test: the first studio with two locations. Status: broken (2026-11-10)

## Not doing

- Native mobile apps. Why: the booking page works on phones, and an app doubles the release work. Revisit: when 30% of bookings come from repeat clients on one device.
- SMS reminders. Why: the cost per message exceeds the budget at pilot volume. Revisit: never.

## Decisions

- 2026-11-18 Focus on M2 Paid bookings. Why: five of eight pilots asked for payment at booking. Rejected: starting M3 Studios that grow first.
- 2026-11-10 A3 is broken: R-011 Confirmations show the studio's timezone revisits R-003 Email confirmations. Why: a studio in Lisbon received confirmations in UTC. Rejected: a per-client timezone setting.
- 2026-10-20 Use one hosted payment provider. Why: no card data touches Slotwise servers. Rejected: building on a payment gateway API directly.
