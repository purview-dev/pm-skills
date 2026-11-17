# Roadmap

## Next

### R-008 Invoice email

- Serves: V1
- Milestone: M1
- Owner: agent
- Done when: A tenant receives one email per issued invoice.
- Size: S
- Depends on: none
- Status: ready

### R-009 Open a Stripe account

- Serves: V1
- Milestone: M1
- Owner: user
- Done when: The production Stripe account is verified and its keys are in the vault.
- Size: S
- Depends on: none
- Status: ready
- Note: Blocks R-010.

### R-010 Charge the first invoice

- Serves: V1
- Milestone: M1
- Owner: both
- Done when: A test card is charged for one invoice.
- Size: M
- Depends on: R-009 Open a Stripe account
- Status: paused

### R-011 Usage dashboard

- Serves: V1
- Owner: agent
- Done when: The dashboard shows seats used this month.
- Size: M
- Depends on: none
- Status: blocked (waiting on the design review, since 2026-11-03)

## Later

### R-013 Tenant notes

- Serves: V2
- Owner: agent
- Done when: A tenant can add one note to an invoice.
- Size: S
- Depends on: none
- Status: ready

### R-012 Self-serve signup

- Serves: V2
- Milestone: M2
- Owner: agent
- Done when: A new visitor creates a tenant
  without our help.
- Size: M
- Depends on: R-008
- Status: ready
- Brief: planning/briefs/R-012-self-serve-signup.md
- Revisits: R-006 Tenant model
