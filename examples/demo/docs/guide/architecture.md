# Architecture

Demo content for the invented product Slotwise.

- The booking page and the dashboard are one TypeScript web app.
- Postgres holds studios, classes, bookings, and payments.
- A hosted payment provider takes the card details, so no card data reaches Slotwise.
- A worker sends confirmation emails in the studio's timezone.
