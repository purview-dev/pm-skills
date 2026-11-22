# Harden the pm-lint folder argument

- Captured: 2026-11-22 14:25
- Source: agent (R-033 finish)
- Kind: tech-debt
- Affects: skills/pm-lint/scripts/lint.ts
- Context: R-033 execute
- Discuss: no
- Related: R-033, R-039
- Brief: none
- Reviewed: never

## Idea

`expandTargets` in `skills/pm-lint/scripts/lint.ts` (added in `981977a`) expands a folder argument one level only, so `check planning/` would miss `inbox/`, `briefs/`, and `decisions/` files; and no test covers `--staged` combined with a folder argument. Also cosmetic: ADR-001's Alternatives row says ADRs are "exported" (quoted from the spec), and the `pm-init` template row keeps "(new project only)" inside the code span because `scripts/validate.ts` parses it.
