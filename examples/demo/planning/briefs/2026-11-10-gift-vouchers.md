# Gift vouchers

- Status: parked
- Origin: planning/inbox/2026-11-10-1400-gift-vouchers.md
- Updated: 2026-11-16

## Problem

- Clients want to give a class as a present, and studios sell paper vouchers by hand.

## Who and evidence

- Two pilots sell about ten paper vouchers a month before the holidays.

## Original idea

Let clients buy a voucher for a friend that pays for any class at the studio.

## Proposal

- A voucher is a prepaid code that pays for one booking.

## Alternatives considered

| Option | Effort | Benefit | Cost |
| --- | --- | --- | --- |
| Do nothing | none | No work. | Paper vouchers stay. |
| **Prepaid codes after payments ship (recommended)** | S | Reuses R-007's checkout. | Waits for M2. |
| Vouchers now with manual payment | M | Ready for the holidays. | A second payment path to maintain. |

## Challenges and answers

- 2026-11-16. Claim: vouchers need card payments, which R-007 is still building. Answer: keep it parked until R-007 is done.

## Ramifications

| Area | Effect | Mitigation |
| --- | --- | --- |
| Data and migrations | A vouchers table. | Additive. |
| Security and privacy | Codes must not be guessable. | Random 12-character codes. |
| Performance | none found | |
| User experience | A code field at checkout. | |
| Operations and cost | none found | |
| Maintenance | none found | |
| Dependencies | Needs R-007. | |
| Reversibility | Reversible. | |

## Done when

- A client buys a voucher, and the recipient books a class with its code.

## Size and slicing

- Size S, one item.

## Open questions

- Do vouchers expire?

## Decision

- 2026-11-16 Keep it parked. Why: it needs R-007 Online payments at booking first.
