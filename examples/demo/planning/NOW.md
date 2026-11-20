# Now

<!--
Edited only by pm-* skills. PM state lives in the main worktree; a completion
record may be written in the worktree that holds the item's branch.
Fields are fixed. When idle, every field except Status is empty.
Status: idle | active
Stage: design | plan | execute | finish
Session: <branch> (worktree <path>, optional)
Brief: optional; the item's brief, if it has one
Milestone: optional; the item's milestone while it is active
-->

- Status: active
- Item: R-007 Online payments at booking
- Session: feat/r-007-online-payments-at-booking
- Stage: execute
- Brief: planning/briefs/R-007-online-payments.md
- Milestone: M2
- Serves: V2
- Owner: agent
- Size: M
- Depends on: R-002
- Revisits:
- Spec: docs/specs/2026-11-17-online-payments-design.md
- Plan: docs/plans/2026-11-17-online-payments.md
- Started: 2026-11-17

## Done when

- A client pays by card on the booking page, and the booking is confirmed only after the payment succeeds.
- The studio dashboard lists the payment with its booking on the same day.
- A failed payment leaves the slot free and shows the client the provider's message.

## Checkpoint 2026-11-19 17:20

- Stopped at: Task 2, step 3 (the payment intent is created on booking).
- Next action: confirm the booking from the provider's webhook.
- Start with: docs/plans/2026-11-17-online-payments.md
- Decisions: the webhook, not the redirect, confirms a booking, because a client can close the tab before the redirect.
- Context: the provider's test mode signs webhooks with a separate secret.
