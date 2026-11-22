# ADR-005 Send emails through our own SMTP server

- Status: deprecated
- Date: 2026-10-30
- Category: operations
- Supersedes: none
- Item: R-003
- Source: none

## Context

R-003 sends booking confirmations. A small SMTP server was quick to set up
for the pilot.

## Decision

Send every confirmation through one SMTP server we run.

## Alternatives

An email delivery service: a monthly cost before the pilot proved demand.

## Consequences

- We watch the server's sending reputation ourselves.
- 2026-11-12 Deprecated: confirmations moved to the email provider's API after messages from the server landed in spam.
