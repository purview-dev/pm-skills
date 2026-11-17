# Risks

## Open

### RK-002 Payment provider changes its API

- Likelihood: medium
- Impact: high
- RAG: red
- RAG override: none
- Status: mitigating
- Owner: agent
- Affects: M1
- Trigger: The provider announces a breaking version
- Mitigation: R-010 Charge the first invoice
- Raised: 2026-11-05 (user)
- Reviewed: 2026-11-08

### RK-003 Seed data leaks real tenant names

- Likelihood: medium
- Impact: medium
- RAG: amber
- RAG override: none
- Status: open
- Owner: agent
- Affects: none
- Trigger: none
- Mitigation: none
- Raised: 2026-11-09 (agent (R-007 execute))
- Reviewed: never

## Closed

### RK-001 No one signs the hosting contract

- Likelihood: low
- Impact: medium
- RAG: amber
- RAG override: the contract has a 30-day notice period (derived green, 2026-11-01)
- Status: closed
- Owner: user
- Affects: none
- Trigger: The contract is not signed by 2026-11-07
- Mitigation: none
- Raised: 2026-10-30 (user)
- Reviewed: 2026-11-01
- Closed: 2026-11-06: the contract is signed

## Removed

- 2026-11-02 RK-004 Duplicate of RK-002. Reason: duplicate.
