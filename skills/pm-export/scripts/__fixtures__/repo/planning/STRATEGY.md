# Strategy

## Current focus

- Milestone: M1
- Why now: Billing blocks every paid pilot.

## Milestones

<!--
### M9 <Name>

- Status: active | planned | done (<YYYY-MM-DD>)
-->

### M1 First paying tenant

- Serves: V1
- Exit criteria: A real tenant pays an invoice end to end.
- Target: 2026-12-15
- Status: active

### M2 Self-serve signup

- Serves: V2, V1
- Exit criteria: A new tenant signs up without help.
- Target: none
- Status: planned

## Bets

- B1: We believe in-app invoicing will stop churn for small teams.
  Evidence: Three pilots asked for invoices last month. We will know when: A tenant pays a second invoice without asking us.
  Status: open

## Assumptions and risks

- A1: Stripe supports our billing cycle. Test: Create a test subscription in the sandbox before R-008.
  Status: holds (2026-11-01)

## Not doing

- Multi-tenant SSO. Why: No pilot has asked for it. Revisit: When a pilot with 20 or more seats signs up.

## Decisions

- 2026-10-29 Bill per seat, not per usage. Why: Pilots can forecast a seat count. Rejected: Usage billing; invoicing outside the app.
