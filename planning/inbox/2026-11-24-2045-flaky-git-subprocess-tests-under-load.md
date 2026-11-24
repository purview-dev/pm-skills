# Flaky git subprocess tests under load

- Captured: 2026-11-24 20:45
- Source: agent (R-013 execute)
- Kind: tech-debt
- Affects: skills/pm-lint/scripts/, skills/pm-next/scripts/sync.test.ts
- Context: R-013 execute
- Discuss: no
- Related: none
- Brief: none
- Reviewed: never

## Idea

During R-013, `bun test scripts/` gave 198 pass and 5 fail while builds and browser tests ran at the same time, and the same suite gave 244 pass and 0 fail on an idle machine. The failing tests were seen in `skills/pm-lint` and `skills/pm-next/scripts/sync.test.ts`, which spawn git subprocesses; they time out or race under load, so a pre-push `just lint-check` can fail without a code change.
