# R-007 Online payments at booking — design

Demo data: an invented spec for the invented product Slotwise.

## Intent

Clients pay by card when they book, so no-shows fall and studios stop chasing transfers.

## Design

- The booking page creates a payment intent and redirects to the provider's hosted checkout.
- The provider's signed webhook confirms the booking. A failed payment frees the slot.
- The dashboard lists each payment beside its booking.
