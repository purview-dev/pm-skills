# Now

<!--
- Status: idle
- Item: R-999 A commented-out example
-->

- Status: active
- Item: R-007 Tenant billing
- Session: feat/r-007-tenant-billing
- Stage: execute
- Brief: planning/briefs/R-007-tenant-billing.md
- Milestone: M1
- Serves: V1
- Owner: both
- Size: M
- Depends on: R-006
- Revisits:
- Spec: docs/superpowers/specs/2026-10-30-tenant-billing.md
- Plan: docs/superpowers/plans/2026-10-31-tenant-billing.md
- Started: 2026-11-02

## Done when

- `bun test billing` passes with the invoice fixture.
- A test tenant sees one invoice for the current period.

## Checkpoint 2026-11-08 14:10

- Stopped at: Step 3 of 7 in the plan
- Next action: Add the invoice line items table
- Start with: docs/superpowers/plans/2026-10-31-tenant-billing.md
- Decisions: The seat count is read from the subscription, not stored.
- Context: Stripe test keys are in .env.local.
- Open question: none
