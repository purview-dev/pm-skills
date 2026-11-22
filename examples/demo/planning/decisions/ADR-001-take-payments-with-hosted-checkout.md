# ADR-001 Take payments with hosted checkout

- Status: accepted
- Date: 2026-10-28
- Category: architecture
- Supersedes: none
- Item: R-007
- Source: none

## Context

R-007 takes a card payment when a class is booked. Studios are small and
cannot carry the card-data compliance work of a payment form on our pages.

## Decision

Send the client to the payment provider's hosted checkout page and record the
booking when its webhook confirms the payment.

## Alternatives

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| Hosted checkout | Least compliance scope; one redirect | Chosen |
| Embedded card form | Stays on our page; full compliance scope | Rejected |
| Pay at the studio | No build; no-shows are not charged | Rejected |

## Consequences

- A booking is pending until the webhook arrives.
- R-016 retries a failed card payment through the same webhook.
