# Online payments at booking

- Status: on roadmap (R-007), active
- Origin: R-007
- Updated: 2026-11-17

## Problem

- Clients book and do not show up, and studios chase payment by bank transfer afterwards.

## Who and evidence

- Five of the eight pilot studios asked for payment at booking in the 2026-11-18 calls.
- Pilots that take a deposit report 4% no-shows against 11% for the rest (STRATEGY.md B1).

## Original idea

Take the full class price by card when the client books.

## Proposal

- The booking page sends the client to the provider's hosted checkout.
- The provider's webhook confirms the booking; a failed payment frees the slot.
- The dashboard lists each payment beside its booking.

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing | none | No work. | No-shows stay at 11%. |
| Deposit only | S | Cuts no-shows. | Studios still chase the rest. |
| **Full payment by hosted checkout (recommended)** | M | No card data on our servers; no-shows fall. | A 1.5% fee per booking. |

## Challenges and answers

- 2026-11-17. Claim: studios may refuse the card fee. Answer: A1 holds; all eight pilots accepted it (STRATEGY.md).

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | A payments table keyed by booking. | Additive migration. |
| Security and privacy | No card data stored; the webhook needs signature checks. | Verify every webhook signature. |
| Performance | none found | |
| User experience | One extra step before the confirmation. | Hosted checkout keeps the studio's colours. |
| Operations and cost | 1.5% per booking. | Shown on the pricing page (R-010). |
| Maintenance | One provider SDK to keep current. | |
| Dependencies | Needs R-002; R-008 and R-016 wait on it. | |
| Reversibility | Payments can be switched off per studio. | |

## Done when

- A client pays by card on the booking page, and the booking is confirmed only after the payment succeeds.
- The studio dashboard lists the payment with its booking on the same day.

## Size and slicing

- Size M, one item.

## Open questions

- none

## Decision

- 2026-11-17 Build it now. Why: the M2 focus, and five pilots asked for it.
