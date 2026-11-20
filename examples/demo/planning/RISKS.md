# Risks

<!--
The risk register. Written only by pm-risk. A missing file is an empty
register. IDs are RK-NNN and never reused, including removed risks.
RAG is derived from Likelihood x Impact (low 1, medium 2, high 3):
6 or more red, 3 or 4 amber, 2 or less green, unless RAG override says why.
Open is ordered red, amber, green, then by ID. Closed is newest first.
-->

## Open

### RK-001 Card payments fail at launch

- Likelihood: high
- Impact: high
- RAG: red
- RAG override: none
- Status: mitigating
- Owner: agent
- Affects: R-007
- Trigger: more than 2% of payments in the provider's test mode end in an error
- Mitigation: R-016
- Raised: 2026-11-17 (agent (R-007 design))
- Reviewed: 2026-11-19

### RK-002 Pilot studios leave before payments ship

- Likelihood: medium
- Impact: high
- RAG: red
- RAG override: none
- Status: open
- Owner: user
- Affects: M2
- Trigger: a pilot studio misses two weekly check-ins
- Mitigation: weekly call with each pilot until M2 is done
- Raised: 2026-11-18 (user)
- Reviewed: 2026-11-18

### RK-003 Google API verification takes months

- Likelihood: medium
- Impact: medium
- RAG: amber
- RAG override: none
- Status: open
- Owner: both
- Affects: R-012
- Trigger: no answer from Google by 2026-12-01
- Mitigation: none
- Raised: 2026-11-12 (agent (R-012 design))
- Reviewed: 2026-11-16

### RK-004 Daylight-saving changes shift class times

- Likelihood: low
- Impact: high
- RAG: amber
- RAG override: none
- Status: accepted
- Owner: agent
- Affects: R-011
- Trigger: a class booked before 2027-03-28 shows a different time after it
- Mitigation: none
- Raised: 2026-11-10 (agent (R-011 review))
- Reviewed: 2026-11-16

### RK-006 Confirmation emails land in spam

- Likelihood: low
- Impact: medium
- RAG: amber
- RAG override: confirmations are the only receipt a pilot client gets, so one lost email costs a support call
- Status: open
- Owner: agent
- Affects: V3
- Trigger: a pilot reports a missing confirmation
- Mitigation: none
- Raised: 2026-11-04 (user)
- Reviewed: 2026-11-16

### RK-005 Hosting costs pass the budget

- Likelihood: low
- Impact: low
- RAG: green
- RAG override: none
- Status: open
- Owner: user
- Affects: none
- Trigger: the monthly bill passes 120 EUR
- Mitigation: none
- Raised: 2026-10-20 (user)
- Reviewed: never

## Closed

### RK-007 Payment provider terms unclear

- Likelihood: medium
- Impact: medium
- RAG: amber
- RAG override: none
- Status: closed
- Owner: user
- Affects: R-002
- Trigger: none
- Mitigation: R-002
- Raised: 2026-10-14 (user)
- Reviewed: 2026-10-24
- Closed: 2026-10-24: the provider confirmed the fee and payout terms in writing.

## Removed

- 2026-11-05 RK-008 Pilot studios leave. Reason: duplicate of RK-002.
