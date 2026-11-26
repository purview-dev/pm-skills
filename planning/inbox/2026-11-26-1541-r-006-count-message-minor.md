# R-006 skill count messages are ambiguous

- Captured: 2026-11-26 15:41
- Source: agent (R-006 done)
- Kind: tech-debt
- Affects: R-006, scripts/skill-counts.ts
- Context: R-006 done
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

The R-006 whole-branch review found one minor in `scripts/skill-counts.ts`: when both numbers on the output line (`- Skills: <27 of 27 installed`) are wrong, validate prints two identical messages (`skill count 27, expected 26`), so the reader cannot tell the installed count from the total. Name which number each message is about ("installed count" or "total").
