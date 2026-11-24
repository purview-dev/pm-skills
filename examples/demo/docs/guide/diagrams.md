# Diagrams

A booking, from the customer's first click to the confirmed class.

<!-- purview:likec4 file="./diagrams/booking-flow.c4" view="bookingFlow" title="Booking flow" -->
```mermaid
flowchart LR
  customer[Customer] --> page[Booking page]
  page --> api[Booking API]
  api --> payments[Hosted checkout]
  payments --> customer
```

[LikeC4 model](./diagrams/booking-flow.c4)
<!-- /purview:likec4 -->

See the [architecture overview](/architecture/overview/) and
[services](/architecture/services/) pages for the live, interactive views.
